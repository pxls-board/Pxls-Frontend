/**
 * Extracts translatable strings into po/Localization.pot.
 *
 * Picks up the first string argument of `t()`, `$t()`, `i18n.t()`, `__()`
 * and `msg()` in .ts/.vue files. A comment starting with `translator:` right
 * before a string (JS comment or `<!-- -->` in templates) becomes a note for
 * translators.
 *
 * Run with `pnpm gen-pot`, then `pnpm update-local` to merge into the .po files.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseSfc } from '@vue/compiler-sfc';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIRS = ['app', 'i18n', 'shared', 'public/admin'];
const SKIP_DIRS = new Set(['vendor', 'node_modules']);
const CALLEES = new Set(['t', '$t', '__', 'msg']);
const TRANSLATOR_COMMENT = /^\s*(?:\/\/|\/\*+|<!--)?\s*translator:\s?(.*?)\s*(?:\*\/|-->)?\s*$/i;

interface Entry {
  msgid: string;
  references: Set<string>;
  comments: string[];
}

const entries = new Map<string, Entry>();

function add(msgid: string, file: string, comments: string[]) {
  let entry = entries.get(msgid);
  if (!entry) {
    entry = { msgid, references: new Set(), comments: [] };
    entries.set(msgid, entry);
  }
  entry.references.add(file);
  for (const comment of comments) {
    if (!entry.comments.includes(comment)) entry.comments.push(comment);
  }
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : listFiles(path);
    return /\.(ts|js|vue)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });
}

function isTranslationCall(node: ts.CallExpression): boolean {
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return CALLEES.has(callee.text);
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text === 't';
  return false;
}

function translatorComments(source: string, node: ts.Node, stop: ts.Node): string[] {
  const comments: string[] = [];
  // Look at comments before the call and its enclosing expressions, up to the statement.
  for (let current: ts.Node | undefined = node; current && current !== stop; current = current.parent) {
    for (const range of ts.getLeadingCommentRanges(source, current.getFullStart()) ?? []) {
      const match = TRANSLATOR_COMMENT.exec(source.slice(range.pos, range.end));
      if (match?.[1]) comments.push(match[1]);
    }
    if (ts.isStatement(current) || ts.isPropertyAssignment(current) || ts.isArrayLiteralExpression(current.parent)) {
      break;
    }
  }
  return comments;
}

/** Extracts strings from TypeScript/JavaScript source. */
function extractScript(source: string, file: string, extraComments: string[] = []) {
  const kind = file.endsWith('.js') ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isTranslationCall(node)) {
      const [argument] = node.arguments;
      const comments = () => [...extraComments, ...translatorComments(source, node, sourceFile)];
      if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
        add(argument.text, file, comments());
      } else if (argument && ts.isTemplateExpression(argument)) {
        // Legacy `__(\`… ${name} …\`)`: the source text is the id, with `${name}` placeholders.
        add(argument.getText(sourceFile).slice(1, -1), file, comments());
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

type TemplateNode = {
  type: number;
  content?: unknown;
  children?: TemplateNode[];
  props?: { type: number; exp?: { content?: string }; name?: string }[];
};

// @vue/compiler-core NodeTypes
const ELEMENT = 1;
const COMMENT = 3;
const INTERPOLATION = 5;
const DIRECTIVE = 7;

function expressionSource(content: string, directive?: string): string {
  if (directive === 'for') {
    const match = /\s(?:in|of)\s([\s\S]*)$/.exec(content);
    return match?.[1] ?? '';
  }
  if (directive === 'on' && /^[\w$.]+$/.test(content.trim())) return '';
  return `(${content});`;
}

/** Extracts strings from a Vue template AST. */
function extractTemplate(nodes: TemplateNode[], file: string) {
  let pending: string[] = [];
  for (const node of nodes) {
    if (node.type === COMMENT) {
      const match = TRANSLATOR_COMMENT.exec(String(node.content ?? ''));
      if (match?.[1]) pending.push(match[1]);
      continue;
    }
    const before = entries.size;
    const expressions: string[] = [];
    if (node.type === INTERPOLATION) {
      const content = (node.content as { content?: string } | undefined)?.content;
      if (content) expressions.push(expressionSource(content));
    }
    if (node.type === ELEMENT) {
      for (const prop of node.props ?? []) {
        if (prop.type === DIRECTIVE && prop.exp?.content) {
          expressions.push(expressionSource(prop.exp.content, prop.name));
        }
      }
    }
    for (const expression of expressions) {
      extractScript(expression, file, pending);
    }
    if (node.children) {
      extractTemplate(node.children, file);
    }
    // A translator comment applies to the next element that has strings.
    if (entries.size !== before || expressions.length > 0) pending = [];
  }
}

function extractVue(source: string, file: string) {
  const { descriptor, errors } = parseSfc(source, { filename: file });
  if (errors.length) {
    throw new Error(`Failed to parse ${file}: ${errors[0]}`);
  }
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (block) extractScript(block.content, file);
  }
  if (descriptor.template?.ast) {
    extractTemplate(descriptor.template.ast.children as TemplateNode[], file);
  }
}

const escape = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');

function render(): string {
  const lines = [
    'msgid ""',
    'msgstr ""',
    '"Project-Id-Version: Pxls\\n"',
    `"POT-Creation-Date: ${new Date().toISOString()}\\n"`,
    '"Language: \\n"',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '',
  ];
  for (const entry of entries.values()) {
    for (const comment of entry.comments) lines.push(`#. ${comment}`);
    lines.push(`#: ${[...entry.references].join(' ')}`);
    lines.push(`msgid "${escape(entry.msgid)}"`);
    lines.push('msgstr ""');
    lines.push('');
  }
  return lines.join('\n');
}

const files = SOURCE_DIRS.flatMap((dir) => listFiles(join(ROOT, dir))).toSorted();
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  const file = `/${relative(ROOT, path)}`;
  if (path.endsWith('.vue')) {
    extractVue(source, file);
  } else {
    extractScript(source, file);
  }
}

const outPath = join(ROOT, 'po', 'Localization.pot');
writeFileSync(outPath, render());
console.info(`Parsed ${files.length} files.`);
console.info(`${entries.size} strings found.`);
console.info(`Output ${outPath}.`);

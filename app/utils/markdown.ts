import twemoji from '@twemoji/api';
import { addIcon, buildIcon, getIcon } from '@iconify/vue';
import { init as initIconBundle } from '#build/nuxt-icon-client-bundle';
import { EMOJI_REGEX } from './emoji-regex';
import '~/vendor/emojiDB.min.js';
import '~/vendor/pxls-markdown';

/* The vendored pxlsMarkdown is a unified-style processor that compiles to DOM nodes. */

interface MarkdownNode {
  value: string;
  emojiName?: string;
  url: string;
  x: number;
  y: number;
  scale?: number;
  classes: string[];
}

type Visitor = (node: MarkdownNode, next: unknown) => Node;

/** Compiler output: nodes, strings, or nested arrays of those. */
export type MarkdownResult = Node | string | null | undefined | MarkdownResult[];

export interface MarkdownProcessor {
  (): MarkdownProcessor;
  use(plugin: unknown, options?: unknown): MarkdownProcessor;
  processSync(input: string): { result: MarkdownResult };
  Compiler: { prototype: { visitors: Record<string, Visitor> } };
}

declare global {
  interface Window {
    emojiDB: Record<string, string>;
    pxlsMarkdown: {
      processor(): MarkdownProcessor;
      plugins: Record<string, unknown>;
    };
  }
}

export interface MarkdownWhitelist {
  block?: string[];
  inline?: string[];
}

const DEFAULT_INLINE = [
  'coordinate',
  'emoji_raw',
  'emoji_name',
  'mention',
  'escape',
  'autoLink',
  'url',
  'underline',
  'strong',
  'emphasis',
  'deletion',
  'code',
];

export function makeMarkdownProcessor(whitelist: MarkdownWhitelist = {}): MarkdownProcessor {
  const md = window.pxlsMarkdown;
  return md
    .processor()
    .use(md.plugins.emoji, {
      emojiDB: window.emojiDB,
      emojiRegex: EMOJI_REGEX,
    })
    .use(md.plugins.methodWhitelist, {
      block: whitelist.block ?? ['blankLine'],
      inline: whitelist.inline ?? DEFAULT_INLINE,
    })
    .use(function (this: MarkdownProcessor) {
      this.Compiler.prototype.visitors.emoji = (node) => {
        if (twemoji.test(node.value)) {
          const span = document.createElement('span');
          span.textContent = node.value;
          twemoji.parse(span);
          const image = (span.firstElementChild as HTMLElement | null) ?? span;
          image.title = `:${node.emojiName}:`;
          return image;
        }
        const image = document.createElement('img');
        image.draggable = false;
        image.className = 'emoji emoji--custom';
        image.alt = `:${node.emojiName}:`;
        image.src = node.value;
        image.title = `:${node.emojiName}:`;
        return image;
      };
      // Banner/notification `[fa …]` icons: map Font Awesome names to our icon set.
      this.Compiler.prototype.visitors.fontAwesomeIcon = (node) => iconElement(iconFromFontAwesome(node.classes));
    });
}

/** Flattens compiler output into DOM nodes. */
export function toNodes(result: MarkdownResult): Node[] {
  if (result == null) return [];
  if (Array.isArray(result)) return result.flatMap(toNodes);
  if (typeof result === 'string') return [document.createTextNode(result)];
  return [result];
}

/** Renders markdown with `processor`, returning DOM nodes. */
export function renderMarkdown(processor: MarkdownProcessor, input: string): Node[] {
  return toNodes(processor.processSync(input).result);
}

/**
 * Renders a bundled icon (e.g. `i-material-symbols-star-rounded`) as an inline
 * SVG, for content built as DOM nodes rather than Vue components.
 */
export function iconElement(name: string): Element {
  initIconBundle(addIcon);
  const id = name.replace(/^i-/, '').replace(/^material-symbols-/, 'material-symbols:');
  const data = getIcon(id);
  if (!data) {
    return document.createElement('span');
  }
  const built = buildIcon(data, { height: '1em' });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries(built.attributes)) {
    svg.setAttribute(key, String(value));
  }
  svg.setAttribute('class', 'inline-block align-[-0.125em]');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = built.body;
  return svg;
}

export { twemoji };

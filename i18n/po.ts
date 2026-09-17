/**
 * Minimal gettext .po parser for the browser. Only msgid/msgstr pairs are
 * needed at runtime; comments and references are ignored.
 */
export function poToMessages(source: string): Record<string, string> {
  const messages: Record<string, string> = {};
  let msgid: string | null = null;
  let msgstr: string | null = null;
  let current: 'msgid' | 'msgstr' | null = null;

  const flush = () => {
    if (msgid && msgstr) {
      // Older extractions kept JS escapes (`Couldn\'t`) in ids.
      messages[msgid.replace(/\\'/g, "'")] = msgstr;
    }
    msgid = msgstr = null;
    current = null;
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('msgid ')) {
      flush();
      current = 'msgid';
      msgid = unquote(line.slice(6));
    } else if (line.startsWith('msgstr ')) {
      current = 'msgstr';
      msgstr = unquote(line.slice(7));
    } else if (line.startsWith('"') && current) {
      if (current === 'msgid') {
        msgid = (msgid ?? '') + unquote(line);
      } else {
        msgstr = (msgstr ?? '') + unquote(line);
      }
    } else if (line === '' || line.startsWith('#')) {
      if (line === '') flush();
    }
  }
  flush();

  return messages;
}

function unquote(value: string): string {
  return value
    .trim()
    .slice(1, -1)
    .replace(/\\(.)/g, (_, char: string) => {
      switch (char) {
        case 'n':
          return '\n';
        case 't':
          return '\t';
        default:
          return char;
      }
    });
}

import type { MessageContext } from 'vue-i18n';

/**
 * Messages are plain gettext strings, not vue-i18n message syntax: they may
 * contain HTML, `@`, `|` and braces. The only interpolation supported is the
 * one the old build supported:
 *  - `{0}`, `{1}` … positional arguments (`t(msg, [a, b])`)
 *  - `${name}` named arguments (`t(msg, { name })`), kept from the old
 *    template-literal based translations so existing .po entries still match.
 */
function compile(source: string) {
  const fn = (ctx: MessageContext) =>
    source
      .replace(/\$\{([^}]+)\}/g, (match, name: string) => {
        const value = ctx.named(name);
        return value === undefined ? match : String(value);
      })
      .replace(/\{(\d+)\}/g, (match, index: string) => {
        const value = ctx.list(Number(index));
        return value === undefined ? match : String(value);
      });
  return fn;
}

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: false,
  // Missing keys fall back to the key itself (the English msgid).
  fallbackFormat: true,
  missingWarn: false,
  fallbackWarn: false,
  warnHtmlMessage: false,
  messageCompiler: (message) => {
    if (typeof message !== 'string') {
      throw new TypeError('Only string messages are supported');
    }
    return compile(message);
  },
}));

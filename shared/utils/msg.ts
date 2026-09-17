/**
 * Marks a string for translation without translating it. `pnpm gen-pot`
 * extracts `msg('…')` like `t('…')`; translate the value later with `t(value)`.
 */
export function msg<T extends string>(text: T): T {
  return text;
}

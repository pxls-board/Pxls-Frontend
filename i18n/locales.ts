export interface PxlsLocale {
  code: string;
  /** English name, used as the translatable label in the language picker. */
  name: string;
  file: string;
}

// `code` matches the suffix of `po/Localization_<code>.po` (English has no suffix).
export const LOCALES: PxlsLocale[] = [
  { code: 'en', name: 'English', file: 'en.ts' },
  { code: 'bg', name: 'Bulgarian', file: 'bg.ts' },
  { code: 'fr', name: 'French', file: 'fr.ts' },
  { code: 'de', name: 'German', file: 'de.ts' },
  { code: 'lv', name: 'Latvian', file: 'lv.ts' },
  { code: 'ru', name: 'Russian', file: 'ru.ts' },
  { code: 'sv', name: 'Swedish', file: 'sv.ts' },
  { code: 'fi', name: 'Finnish', file: 'fi.ts' },
  { code: 'tok', name: 'Toki Pona', file: 'tok.ts' },
];

export const LANGUAGE_COOKIE = 'pxls-accept-language-override';

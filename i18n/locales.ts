import { msg } from '../shared/utils/msg';

export interface PxlsLocale {
  code: string;
  /** English name, used as the translatable label in the language picker. */
  name: string;
  file: string;
}

// `code` matches the suffix of `po/Localization_<code>.po` (English has no suffix).
export const LOCALES: PxlsLocale[] = [
  { code: 'en', name: msg('English'), file: 'en.ts' },
  { code: 'bg', name: msg('Bulgarian'), file: 'bg.ts' },
  { code: 'fr', name: msg('French'), file: 'fr.ts' },
  { code: 'de', name: msg('German'), file: 'de.ts' },
  { code: 'lv', name: msg('Latvian'), file: 'lv.ts' },
  { code: 'ru', name: msg('Russian'), file: 'ru.ts' },
  { code: 'sv', name: msg('Swedish'), file: 'sv.ts' },
  { code: 'fi', name: msg('Finnish'), file: 'fi.ts' },
  { code: 'tok', name: msg('Toki Pona'), file: 'tok.ts' },
];

export const LANGUAGE_COOKIE = 'pxls-accept-language-override';

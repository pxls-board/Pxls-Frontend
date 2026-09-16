import { LANGUAGE_COOKIE, LOCALES } from '~~/i18n/locales';

type LocaleCode = (typeof LOCALES)[number]['code'];

const supported = (code: string | null | undefined): code is LocaleCode =>
  !!code && LOCALES.some((locale) => locale.code === code);

function browserLocale(): LocaleCode | null {
  for (const language of navigator.languages ?? [navigator.language]) {
    const code = language.toLowerCase().split('-')[0];
    if (supported(code)) return code;
  }
  return null;
}

/**
 * Picks the language: the override setting (mirrored in a cookie so the
 * back end and other pages see it), then the browser language, then English.
 */
export default defineNuxtPlugin({
  name: 'pxls-locale',
  dependsOn: ['i18n:plugin', 'pinia'],
  async setup(nuxtApp) {
    const i18n = nuxtApp.$i18n;
    const setting = useSettings().ui.language.override;

    const resolve = () => {
      const override = setting.get() || getCookie(LANGUAGE_COOKIE);
      return (supported(override) ? override : null) ?? browserLocale() ?? 'en';
    };

    const apply = async (code: LocaleCode) => {
      await i18n.setLocale(code as Parameters<typeof i18n.setLocale>[0]);
      document.documentElement.lang = code;
    };

    await apply(resolve());

    setting.listen((value) => {
      if (value) {
        setCookie(LANGUAGE_COOKIE, value, 365);
      } else {
        setCookie(LANGUAGE_COOKIE, null, -1);
      }
      const code = resolve();
      if (code !== i18n.locale.value) {
        void apply(code);
      }
    });
  },
});

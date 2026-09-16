import { detectInstaban } from '~/api/install';

export default defineNuxtPlugin((nuxtApp) => {
  // Must run before anything defines `window.App`.
  const instaban = detectInstaban();

  // Runtime gettext for legacy scripts (the admin script uses `__()`).
  window.__ = (text: string) => nuxtApp.$i18n.t(text);

  return {
    provide: {
      pxlsInstaban: instaban,
    },
  };
});

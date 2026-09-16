/** Applies the selected theme: `data-pxls-theme` (Tailwind variants), color mode and theme-color. */
export default defineNuxtPlugin({
  name: 'pxls-theme',
  dependsOn: ['pinia'],
  setup() {
    const colorMode = useColorMode();
    const settings = useSettings();

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }

    settings.ui.theme.index.listen((value) => {
      const theme = THEMES[parseInt(value)] ?? null;
      const root = document.documentElement;
      if (theme) {
        root.dataset.pxlsTheme = theme.id;
        colorMode.preference = theme.colorMode;
        meta.content = theme.color;
      } else {
        delete root.dataset.pxlsTheme;
        colorMode.preference = 'light';
        meta.removeAttribute('content');
      }
    });
  },
});

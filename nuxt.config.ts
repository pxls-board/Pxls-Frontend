import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES } from './i18n/locales';

const proxyTo = process.env.NUXT_PROXY_TO || 'localhost:4567';

// Files in public/ are served by Nitro; every other unknown path is proxied.
const publicDir = fileURLToPath(new URL('./public', import.meta.url));
const publicFiles = readdirSync(publicDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => `/${entry.parentPath.slice(publicDir.length + 1)}/${entry.name}`.replace(/^\/\//, '/'));

// Vite supports `?raw` imports natively; Nitro's Rollup build (which also
// bundles the i18n locale loaders) needs this to read the .po files.
const rawImportPlugin = {
  name: 'pxls:raw-import',
  resolveId(id: string, importer?: string) {
    if (id.endsWith('?raw') && importer) {
      return resolve(dirname(importer), id);
    }
    return null;
  },
  load(id: string) {
    if (id.endsWith('?raw')) {
      return `export default ${JSON.stringify(readFileSync(id.slice(0, -'?raw'.length), 'utf8'))};`;
    }
    return null;
  },
};

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  ssr: false,
  devtools: { enabled: false },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/i18n', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // Components are named by file name only (no folder prefix).
  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'keywords', content: 'pxls, pixels, place, place clone, art, r/place' },
        { name: 'google-play-app', content: 'app-id=space.pxls.android' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0',
        },
      ],
      link: [{ rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' }],
    },
  },

  runtimeConfig: {
    // Overridden by NUXT_PROXY_TO at runtime.
    proxyTo,
    public: {
      // Overridden by NUXT_PUBLIC_TITLE at runtime.
      title: 'pxls.space',
    },
  },

  ui: {
    fonts: false,
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'],
    },
  },

  icon: {
    // Bundle every icon we use so nothing is fetched from the Iconify API at runtime.
    provider: 'none',
    fallbackToApi: false,
    clientBundle: {
      scan: {
        globInclude: ['app/**/*.{vue,ts}'],
      },
      includeCustomCollections: true,
    },
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: LOCALES.map(({ code, name, file }) => ({ code, name, file })),
    langDir: 'locales',
    vueI18n: './i18n.config.ts',
  },

  nitro: {
    virtual: {
      '#pxls/public-files': () => `export default ${JSON.stringify(publicFiles)};`,
    },
    rollupConfig: {
      plugins: [rawImportPlugin],
    },
  },

  $production: {
    nitro: {
      preset: 'node-server',
      // node-server entry + WebSocket upgrade proxy for /ws.
      entry: fileURLToPath(new URL('./server/entry.node.ts', import.meta.url)),
    },
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  typescript: {
    strict: true,
  },
});

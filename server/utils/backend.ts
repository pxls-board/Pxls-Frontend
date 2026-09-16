import type { H3Event } from 'h3';

/** Base URL of the Pxls back end, without a trailing slash. */
export function backendUrl(protocol: 'http' | 'ws' = 'http'): string {
  const { proxyTo } = useRuntimeConfig();
  return `${protocol}://${proxyTo}`;
}

/**
 * Paths served by this app rather than the back end. Everything else is
 * forwarded, mirroring the old Express server which proxied any request it
 * did not render or serve from `dist/` itself.
 */
export function isFrontendPath(path: string): boolean {
  return (
    path === '/' ||
    path === '/profile' ||
    path.startsWith('/profile/') ||
    // Nuxt internals: /_nuxt, /__nuxt_error, /_i18n, /api/_nuxt_icon …
    path.startsWith('/_') ||
    path.startsWith('/api/_') ||
    isPublicAsset(path)
  );
}

export function isNavigationRequest(event: H3Event): boolean {
  return (
    event.method === 'GET' &&
    (getRequestHeader(event, 'sec-fetch-mode') === 'navigate' ||
      (getRequestHeader(event, 'accept') ?? '').includes('text/html'))
  );
}

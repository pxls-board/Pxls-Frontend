import source from '../../shared/pxls-api.d.ts?raw';

/** Type declarations for userscript authors (`/// <reference path="…/pxls-api.d.ts" />`). */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
  setResponseHeader(event, 'cache-control', 'public, max-age=3600');
  return source;
});

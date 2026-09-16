import publicFiles from '#pxls/public-files';

const files = new Set<string>(publicFiles);

/** Whether `path` names a file from `public/` (served by Nitro, not proxied). */
export function isPublicAsset(path: string): boolean {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  return files.has(decoded);
}

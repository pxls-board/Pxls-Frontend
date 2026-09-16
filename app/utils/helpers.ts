export async function binaryAjax(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function createImageData(width: number, height: number): ImageData {
  try {
    return new ImageData(width, height);
  } catch {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d')!.getImageData(0, 0, width, height);
  }
}

export const intToHex = (value: number) => `#${`000000${(value >>> 0).toString(16)}`.slice(-6)}`;

export function hexToRGB(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

declare global {
  interface Window {
    ga?: (...args: unknown[]) => void;
  }
}

export function analytics(...args: unknown[]): void {
  window.ga?.(...args);
}

/** Memoizes an async factory so the request only starts when first awaited. */
export function lazy<T>(factory: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  return () => (promise ??= factory());
}

/** Parses a JSON error body (`{ details }` / `{ message }`) with a text fallback. */
export async function readErrorDetails(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text) as { details?: string; message?: string };
    return json.details ?? json.message ?? text;
  } catch {
    return text;
  }
}

/** POSTs form-encoded data, like `$.post` did. Throws with the response on failure. */
export async function postForm(url: string, data: Record<string, string | number | boolean>): Promise<Response> {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    body.append(key, String(value));
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  });
  if (!response.ok) {
    throw new HttpError(response);
  }
  return response;
}

export class HttpError extends Error {
  constructor(public response: Response) {
    super(`HTTP ${response.status} ${response.statusText}`);
  }
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

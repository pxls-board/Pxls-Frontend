/**
 * JSON storage wrappers with a cookie fallback, kept compatible with the old
 * client so existing settings, templates and ignores carry over.
 */

export function getCookie(name: string): string | undefined {
  for (const part of document.cookie.split(';')) {
    const index = part.indexOf('=');
    const key = part.slice(0, index).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(index + 1));
    }
  }
  return undefined;
}

export function setCookie(name: string, value: string | null, days?: number | null): void {
  let cookie = `${name}=${encodeURIComponent(value ?? '')}; path=/`;
  if (days != null) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    cookie += `; expires=${expires.toUTCString()}`;
  }
  document.cookie = cookie;
}

export interface JsonStorage {
  support(): boolean;
  get<T = unknown>(name: string): T | null;
  has(name: string): boolean;
  set(name: string, value: unknown): void;
  remove(name: string): void;
}

function storageFactory(getStorage: () => Storage, prefix: string, days: number | null): JsonStorage {
  let haveSupport: boolean | null = null;

  const support = () => {
    if (haveSupport === null) {
      try {
        const storage = getStorage();
        storage.setItem('test', '1');
        haveSupport = storage.getItem('test') === '1';
        storage.removeItem('test');
      } catch {
        haveSupport = false;
      }
    }
    return haveSupport;
  };

  const read = (name: string): string | null =>
    support() ? getStorage().getItem(name) : (getCookie(prefix + name) ?? null);

  return {
    support,
    get<T>(name: string) {
      const raw = read(name);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    has: (name) => read(name) !== null,
    set(name, value) {
      const json = JSON.stringify(value);
      if (support()) {
        getStorage().setItem(name, json);
      } else {
        setCookie(prefix + name, json, days);
      }
    },
    remove(name) {
      if (support()) {
        getStorage().removeItem(name);
      } else {
        setCookie(prefix + name, '', -1);
      }
    },
  };
}

export const ls = storageFactory(() => window.localStorage, 'ls_', 99);
export const ss = storageFactory(() => window.sessionStorage, 'ss_', null);

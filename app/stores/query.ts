/**
 * The URL hash (`#x=…&y=…&template=…`) as app state. Updates to the hash
 * from outside (links, back button) are emitted as `queryUpdated` events.
 */
export const useQueryStore = defineStore('query', () => {
  const params: Record<string, string | null> = {};
  let timer: ReturnType<typeof setTimeout> | null = null;

  const trigger = (propName: string, oldValue: string | null | undefined, newValue: string | null) =>
    pxlsEvents.emit('queryUpdated', { propName, oldValue, newValue });

  function parseLocation(): Record<string, string | undefined> {
    let raw = window.location.hash.substring(1);
    if (window.location.search.length > 0) {
      raw += `&${window.location.search.substring(1)}`;
    }
    const vars: Record<string, string | undefined> = {};
    for (const pair of raw.split('&')) {
      const [rawKey, ...rest] = pair.split('=');
      const key = (rawKey ?? '').toLowerCase();
      if (!key.length) continue;
      vars[key] = rest.length ? rest[0] : undefined;
    }
    return vars;
  }

  function update(fromEvent = false) {
    const vars = parseLocation();
    const keys = Object.keys(vars);
    for (const key of keys) {
      const value = vars[key] ?? null;
      if (fromEvent) {
        if (!(key in params) || params[key] !== value) {
          const oldValue = params[key];
          params[key] = value;
          trigger(key, oldValue, value);
        }
      } else if (!(key in params)) {
        params[key] = value;
      }
    }

    if (fromEvent) {
      for (const key of Object.keys(params).filter((name) => !keys.includes(name))) {
        remove(key);
      }
    }

    if (window.location.search.substring(1)) {
      window.location.href = `${window.location.pathname}#${getStr()}`;
    }
  }

  function getStr(): string {
    return Object.entries(params)
      .map(([key, value]) => {
        let part = encodeURIComponent(key);
        if (value !== null) {
          let decoded = value;
          try {
            decoded = decodeURIComponent(value);
          } catch {
            // malformed; leave as-is
          }
          // Don't double-encode values that are already URL-encoded.
          part += `=${decoded === value ? encodeURIComponent(value) : value}`;
        }
        return part;
      })
      .join('&');
  }

  function flush() {
    // replaceState keeps these frequent updates out of the back-button history.
    window.history.replaceState(window.history.state, '', `#${getStr()}`);
  }

  function lazyUpdate() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, 200);
  }

  function setOne(name: string, value: unknown, silent?: boolean) {
    const oldValue = params[name];
    params[name] = String(value);
    if (silent !== true) trigger(name, oldValue, String(value));
    lazyUpdate();
  }

  /**
   * set({ oo: 0.3, template: '…' }, silent?)
   * set('template', '…', silent?)
   * Only updates keys whose value differs.
   */
  function set(keyOrValues: string | Record<string, unknown>, valueOrSilent?: unknown, maybeSilent?: boolean) {
    let values: Record<string, unknown>;
    let silent: boolean;
    if (typeof keyOrValues === 'string') {
      values = { [keyOrValues]: valueOrSilent };
      silent = maybeSilent === true;
    } else {
      values = keyOrValues;
      silent = valueOrSilent === true;
    }
    for (const [key, value] of Object.entries(values)) {
      if (value == null) continue;
      if (get(key) === String(value)) continue;
      setOne(key, value, silent);
    }
  }

  function get(name: string): string | null | undefined {
    return params[name];
  }

  function remove(name: string, silent?: boolean) {
    const oldValue = params[name];
    delete params[name];
    lazyUpdate();
    if (silent !== true) trigger(name, oldValue, null);
  }

  function init() {
    const saved = ss.get<string>('url_params');
    if (saved) {
      window.history.replaceState(window.history.state, '', `#${saved}`);
      ss.remove('url_params');
    }
    update();
    window.addEventListener('hashchange', () => update(true));
  }

  return {
    init,
    get,
    set,
    has: (name: string) => get(name) != null,
    remove,
    update: flush,
    lazy_update: lazyUpdate,
    getStr,
  };
});

import type { LookupData } from '~/types/pxls';

/** A hook's value: text, a DOM node, or a jQuery-like wrapper (admin script). */
export type LookupHookValue = string | number | Node | { jquery: string; get(): Node[] } | null | undefined;

export interface LookupHook {
  id: string;
  name: string;
  sensitive: boolean;
  backgroundCompatible: boolean;
  get: (data: LookupData) => LookupHookValue;
  css: Record<string, string>;
}

/** Pixel lookups (shift+click / long press) and the hooks shown in the popup. */
export const useLookupStore = defineStore('lookup', () => {
  const hooks = shallowRef<LookupHook[]>([]);
  const current = shallowRef<LookupData | null>(null);
  const error = ref(false);
  const visible = ref(false);
  let handle: ((data: LookupData) => void) | null = null;

  function registerHook(...newHooks: Partial<LookupHook>[]) {
    hooks.value = [
      ...hooks.value,
      ...newHooks.map((hook) => ({
        id: hook.id || 'hook',
        name: hook.name || 'Hook',
        sensitive: hook.sensitive || false,
        backgroundCompatible: hook.backgroundCompatible || false,
        get: hook.get || (() => null),
        css: hook.css || {},
      })),
    ];
    return hooks.value.length;
  }

  function replaceHook(hookId: string, newHook: Partial<LookupHook>) {
    const { id: _ignored, ...rest } = newHook;
    hooks.value = hooks.value.map((hook) => (hook.id === hookId ? Object.assign(hook, rest) : hook));
  }

  function unregisterHook(hookId: string) {
    hooks.value = hooks.value.filter((hook) => hook.id !== hookId);
  }

  function show(data: LookupData) {
    current.value = data;
    error.value = false;
    visible.value = true;
  }

  function hide() {
    visible.value = false;
  }

  async function runLookup(clientX: number, clientY: number) {
    const position = useBoardStore().fromScreen(clientX, clientY);
    try {
      const response = await fetch(`/lookup?x=${position.x}&y=${position.y}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const data: LookupData = (text ? JSON.parse(text) : null) ?? { x: position.x, y: position.y, bg: true };
      if (data.username) {
        useChatStore().addTypeaheadUser(data.username);
      }
      if (handle) {
        handle(data);
      } else {
        show(data);
      }
    } catch {
      current.value = { x: position.x, y: position.y };
      error.value = true;
      visible.value = true;
    }
  }

  async function report(id: number, x: number, y: number, message: string) {
    await postForm('/report', { id, x, y, message });
  }

  function webinit() {
    const { $i18n } = useNuxtApp();
    const t = $i18n.t;
    const board = useBoardStore();
    const snip = board.snipMode;

    const link = (href: string, text: string, title?: string) => {
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.textContent = text;
      anchor.className = 'text-primary underline underline-offset-2';
      if (title) {
        anchor.title = title;
        anchor.target = '_blank';
      }
      return anchor;
    };

    registerHook(
      {
        id: 'coords',
        name: t('Coords'),
        get: (data) => link(getLinkToCoords(data.x, data.y), `(${data.x}, ${data.y})`),
        backgroundCompatible: true,
      },
      {
        id: 'username',
        name: t('Username'),
        sensitive: snip,
        get: (data) => {
          if (!data.username) return null;
          return snip ? data.username : link(`/profile/${data.username}`, data.username, t('View Profile'));
        },
      },
      {
        id: 'faction',
        name: t('Faction'),
        sensitive: snip,
        get: (data) => data.faction || null,
      },
      {
        id: 'origin',
        name: t('Origin'),
        get: (data) => {
          switch (data.origin) {
            case 'nuke':
              return t('Part of a nuke');
            case 'mod':
              return t('Placed by a staff member using placement overrides');
            default:
              return null;
          }
        },
      },
      {
        id: 'time',
        name: t('Time'),
        get: (data) => {
          if (!data.time) return null;
          const span = document.createElement('span');
          span.title = new Date(data.time).toLocaleString();
          span.textContent = relativeLookupTime(data.time, t);
          return span;
        },
      },
      {
        id: 'pixels',
        name: t('Pixels'),
        sensitive: snip,
        get: (data) => data.pixelCount,
      },
      {
        id: 'pixels_alltime',
        name: t('Alltime Pixels'),
        sensitive: snip,
        get: (data) => data.pixelCountAlltime,
      },
      {
        id: 'discord_name',
        name: t('Discord'),
        sensitive: snip,
        get: (data) => data.discordName,
      },
    );
  }

  return {
    hooks,
    current,
    error,
    visible,
    registerHook,
    replaceHook,
    unregisterHook,
    runLookup,
    show,
    hide,
    report,
    webinit,
    registerHandle: (fn: (data: LookupData) => void) => {
      handle = fn;
    },
    clearHandle: () => {
      handle = null;
    },
  };
});

function relativeLookupTime(time: number, t: (key: string, params?: Record<string, unknown>) => string): string {
  const delta = (Date.now() - time) / 1000;
  const stamp = new Date(time).toLocaleString();
  if (delta > 24 * 3600) return stamp;
  if (delta < 5) return t('just now');
  const pad = (value: number) => String(value).padStart(2, '0');
  return t('${hoursStr}:${minuteStr}:${secsStr} ago', {
    hoursStr: pad(Math.floor(delta / 3600)),
    minuteStr: pad(Math.floor(delta / 60) % 60),
    secsStr: pad(Math.floor(delta % 60)),
  });
}

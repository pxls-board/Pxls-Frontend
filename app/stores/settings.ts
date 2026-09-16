import type { Ref } from 'vue';

export type SettingKind = 'toggle' | 'range' | 'text' | 'number' | 'select';

type SettingValue<K extends SettingKind> = K extends 'toggle'
  ? boolean
  : K extends 'range' | 'number'
    ? number
    : string;

type Listener<T> = (value: T) => void;

export interface Setting<T> {
  readonly name: string;
  readonly kind: SettingKind;
  readonly defaultValue: T;
  /** Reactive value; assigning it validates and persists. */
  readonly value: Ref<T>;
  /** Whether bound controls should be disabled. */
  readonly disabled: Ref<boolean>;
  get(): T;
  set(value: unknown): void;
  reset(): void;
  /** Calls `listener` now and whenever the value changes. */
  listen(listener: Listener<T>): void;
  unlisten(listener: Listener<T>): void;
  toggle(): void;
  /** Binds plain DOM inputs (used by userscripts and the admin script). */
  controls: {
    add(control: Element | ArrayLike<Element> | { get(): Element[] }): void;
    remove(control: Element | ArrayLike<Element> | { get(): Element[] }): void;
    disable(): void;
    enable(): void;
  };
}

function validate<K extends SettingKind>(kind: K, value: unknown, fallback: SettingValue<K>): SettingValue<K> {
  switch (kind) {
    case 'toggle':
      return (value === true || value === false ? value : fallback) as SettingValue<K>;
    case 'text':
      return (typeof value === 'string' ? value : fallback) as SettingValue<K>;
    case 'number':
    case 'range': {
      const parsed = typeof value === 'number' ? value : parseFloat(String(value));
      return (Number.isNaN(parsed) ? fallback : parsed) as SettingValue<K>;
    }
    case 'select':
      return (value != null ? String(value) : fallback) as SettingValue<K>;
  }
  return fallback;
}

function toElements(control: Element | ArrayLike<Element> | { get(): Element[] }): HTMLInputElement[] {
  if (control instanceof Element) return [control as HTMLInputElement];
  if ('get' in control && typeof control.get === 'function') return control.get() as HTMLInputElement[];
  return Array.from(control as ArrayLike<HTMLInputElement>);
}

function createSetting<K extends SettingKind>(
  name: string,
  kind: K,
  defaultValue: SettingValue<K>,
): Setting<SettingValue<K>> {
  type T = SettingValue<K>;
  const listeners = new Set<Listener<T>>();
  const boundControls = new Map<HTMLInputElement, () => void>();
  const disabled = ref(false);
  const state = ref(validate(kind, ls.get(name), defaultValue)) as Ref<T>;

  const syncControls = () => {
    for (const element of boundControls.keys()) {
      if (element.type === 'checkbox') {
        element.checked = state.value === true;
      } else {
        element.value = String(state.value);
      }
      element.disabled = disabled.value;
    }
  };

  const set = (value: unknown) => {
    const valid = validate(kind, value, defaultValue);
    ls.set(name, valid);
    state.value = valid;
    syncControls();
    for (const listener of listeners) listener(valid);
  };

  const value = computed<T>({
    get: () => state.value,
    set,
  });

  watch(disabled, syncControls);

  const setting: Setting<T> = {
    name,
    kind,
    defaultValue,
    value,
    disabled,
    get: () => state.value,
    set,
    reset: () => set(defaultValue),
    listen(listener) {
      listeners.add(listener);
      listener(state.value);
    },
    unlisten(listener) {
      listeners.delete(listener);
    },
    toggle() {
      if (kind === 'toggle') set(!state.value);
    },
    controls: {
      add(control) {
        for (const element of toElements(control)) {
          if (boundControls.has(element)) continue;
          const eventName = kind === 'range' ? 'input' : 'change';
          const handler = () => set(element.type === 'checkbox' ? element.checked : element.value);
          element.addEventListener(eventName, handler);
          boundControls.set(element, () => element.removeEventListener(eventName, handler));
        }
        syncControls();
      },
      remove(control) {
        for (const element of toElements(control)) {
          boundControls.get(element)?.();
          boundControls.delete(element);
        }
      },
      disable: () => {
        disabled.value = true;
      },
      enable: () => {
        disabled.value = false;
      },
    },
  };
  return setting;
}

// Old setting keys → new keys. Entries in FLIPPED changed meaning from "off" to "on".
const KEY_MIGRATIONS: Record<string, string> = {
  'currentTheme': 'ui.theme.index',
  'audio_muted': 'audio.enable',
  'heatmap': 'board.heatmap.enable',
  'virgimap': 'board.virginmap.enable',
  'view_grid': 'board.grid.enable',
  'canvas.unlocked': 'board.lock.enable',
  'nativenotifications.pixel-avail': 'place.notification.enable',
  'autoReset': 'place.deselectonplace.enable',
  'zoomBaseValue': 'board.zoom.sensitivity',
  'increased_zoom': 'board.zoom.limit.enable',
  'scrollSwitchEnabled': 'place.palette.scrolling.enable',
  'scrollSwitchDirectionInverted': 'place.palette.scrolling.invert',
  'ui.show-reticule': 'ui.reticule.enable',
  'ui.show-cursor': 'ui.cursor.enable',
  'templateBeneathHeatmap': 'board.template.beneathoverlays',
  'enableMiddleMouseSelect': 'place.picker.enable',
  'enableNumberedPalette': 'ui.palette.numbers.enable',
  'heatmap_background_opacity': 'board.heatmap.opacity',
  'virginmap_background_opacity': 'board.virginmap.opacity',
  'snapshotImageFormat': 'board.snapshot.format',
  'bubble-position': 'ui.bubble.position',
  'bubble-animation': 'ui.bubble.animation',
  'brightness.enabled': 'ui.brightness.enable',
  'colorBrightness': 'ui.brightness.value',
  'alert.src': 'audio.alert.src',
  'alert.volume': 'audio.alert.volume',
  'alert_delay': 'place.alert.delay',
  'chrome-canvas-offset-workaround': 'fix.chrome.offset.enable',
  'hide_sensitive': 'lookup.filter.sensitive.enable',
  'chat.font-size': 'chat.font.size',
  'chat.internalClickDefault': 'chat.links.internal.behavior',
  'chat.24h': 'chat.timestamps.24h',
  'chat.text-icons-enabled': 'chat.badges.enable',
  'chat.faction-tags-enabled': 'chat.factiontags.enable',
  'chat.pings-enabled': 'chat.pings.enable',
  'chat.ping-audio-state': 'chat.pings.audio.when',
  'chat.ping-audio-volume': 'chat.pings.audio.volume',
  'chat.banner-enabled': 'ui.chat.banner.enable',
  'chat.use-template-urls': 'chat.links.templates.preferurls',
  'chat.horizontal': 'ui.chat.horizontal.enable',
};
const FLIPPED = new Set(['audio_muted', 'increased_zoom', 'canvas.unlocked']);

function migrateLegacyKeys() {
  for (const [oldKey, newKey] of Object.entries(KEY_MIGRATIONS)) {
    if (ls.has(oldKey)) {
      const oldValue = ls.get(oldKey);
      ls.set(newKey, FLIPPED.has(oldKey) ? !oldValue : oldValue);
      ls.remove(oldKey);
    }
  }
}

function buildSettings() {
  migrateLegacyKeys();
  const { possiblyMobile, webkitBased } = browserFlags();

  return {
    ui: {
      language: {
        override: createSetting('ui.language.override', 'select', ''),
      },
      theme: {
        index: createSetting('ui.theme.index', 'select', '-1'),
      },
      reticule: {
        enable: createSetting('ui.reticule.enable', 'toggle', !possiblyMobile),
      },
      cursor: {
        enable: createSetting('ui.cursor.enable', 'toggle', !possiblyMobile),
      },
      bubble: {
        position: createSetting('ui.bubble.position', 'select', 'bottom left'),
        animation: createSetting('ui.bubble.animation', 'select', 'plusone'),
        compact: createSetting('ui.bubble.compact', 'toggle', false),
      },
      brightness: {
        enable: createSetting('ui.brightness.enable', 'toggle', false),
        value: createSetting('ui.brightness.value', 'range', 1),
      },
      palette: {
        numbers: {
          enable: createSetting('ui.palette.numbers.enable', 'toggle', false),
        },
        scrollbar: {
          thin: {
            enable: createSetting('ui.palette.scrollbar.thin.enable', 'toggle', true),
          },
        },
        stacking: {
          enable: createSetting('ui.palette.stacking.enable', 'toggle', false),
        },
      },
      chat: {
        banner: {
          enable: createSetting('ui.chat.banner.enable', 'toggle', true),
        },
        horizontal: {
          enable: createSetting('ui.chat.horizontal.enable', 'toggle', false),
        },
        icon: {
          badge: createSetting('ui.chat.icon.badge', 'select', 'ping'),
          color: createSetting('ui.chat.icon.color', 'select', 'message'),
        },
      },
    },
    audio: {
      enable: createSetting('audio.enable', 'toggle', true),
      alert: {
        src: createSetting('audio.alert.src', 'text', ''),
        volume: createSetting('audio.alert.volume', 'range', 1),
      },
    },
    board: {
      heatmap: {
        enable: createSetting('board.heatmap.enable', 'toggle', false),
        opacity: createSetting('board.heatmap.opacity', 'range', 0.5),
      },
      virginmap: {
        enable: createSetting('board.virginmap.enable', 'toggle', false),
        opacity: createSetting('board.virginmap.opacity', 'range', 0.5),
      },
      grid: {
        enable: createSetting('board.grid.enable', 'toggle', false),
      },
      lock: {
        enable: createSetting('board.lock.enable', 'toggle', false),
      },
      zoom: {
        sensitivity: createSetting('board.zoom.sensitivity', 'range', 1.5),
        limit: {
          minimum: createSetting('board.zoom.limit.minimum', 'number', 0.5),
          maximum: createSetting('board.zoom.limit.maximum', 'number', 50),
        },
        rounding: {
          enable: createSetting('board.zoom.rounding.enable', 'toggle', false),
        },
      },
      template: {
        beneathoverlays: createSetting('board.template.beneathoverlays', 'toggle', false),
        opacity: createSetting('board.template.opacity', 'range', 1),
        style: {
          // `source` is the selected style URL; `customsource` backs the
          // "Custom…" entry. A simpler design could drop the latter.
          source: createSetting('board.template.style.source', 'select', ''),
          customsource: createSetting('board.template.style.customsource', 'text', ''),
        },
      },
      snapshot: {
        format: createSetting('board.snapshot.format', 'select', 'image/png'),
      },
    },
    place: {
      notification: {
        enable: createSetting('place.notification.enable', 'toggle', true),
      },
      deselectonplace: {
        enable: createSetting('place.deselectonplace.enable', 'toggle', false),
      },
      palette: {
        scrolling: {
          enable: createSetting('place.palette.scrolling.enable', 'toggle', false),
          invert: createSetting('place.palette.scrolling.invert', 'toggle', false),
        },
      },
      picker: {
        enable: createSetting('place.picker.enable', 'toggle', true),
      },
      rightclick: {
        action: createSetting('ui.rightclick.action', 'select', 'nothing'),
      },
      alert: {
        delay: createSetting('place.alert.delay', 'number', 0),
      },
    },
    lookup: {
      filter: {
        sensitive: {
          enable: createSetting('lookup.filter.sensitive.enable', 'toggle', false),
        },
      },
    },
    chat: {
      enable: createSetting('chat.enable', 'toggle', true),
      timestamps: {
        '24h': createSetting('chat.timestamps.24h', 'toggle', false),
      },
      badges: {
        enable: createSetting('chat.badges.enable', 'toggle', false),
      },
      factiontags: {
        enable: createSetting('chat.factiontags.enable', 'toggle', true),
      },
      pings: {
        enable: createSetting('chat.pings.enable', 'toggle', true),
        audio: {
          when: createSetting('chat.pings.audio.when', 'select', 'off'),
          volume: createSetting('chat.pings.audio.volume', 'range', 0.5),
        },
      },
      links: {
        templates: {
          preferurls: createSetting('chat.links.templates.preferurls', 'toggle', false),
        },
        internal: {
          behavior: createSetting('chat.links.internal.behavior', 'select', 'ask'),
        },
        external: {
          skip: createSetting('chat.links.external.skip', 'toggle', false),
        },
      },
      font: {
        size: createSetting('chat.font.size', 'number', 16),
      },
      truncate: {
        max: createSetting('chat.truncate.max', 'number', 250),
      },
    },
    fix: {
      chrome: {
        offset: {
          enable: createSetting('fix.chrome.offset.enable', 'toggle', webkitBased),
        },
      },
    },
  };
}

export type SettingsTree = ReturnType<typeof buildSettings>;

export const useSettingsStore = defineStore('settings', () => {
  // Setting objects keep their own refs; mark the tree raw so Pinia doesn't unwrap them.
  const tree = markRaw(buildSettings());
  const search = ref('');

  const filter = {
    search(query: string) {
      search.value = typeof query === 'string' ? query : '';
    },
  };

  return { settings: tree, search, filter };
});

/** Shortcut for `useSettingsStore().settings`. */
export function useSettings(): SettingsTree {
  return useSettingsStore().settings;
}

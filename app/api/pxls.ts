import type { PxlsApi } from '~~/shared/pxls-api';

/**
 * Builds the public userscript API (`window.pxls`). Its types live in
 * `shared/pxls-api.d.ts`, which is also published for script authors.
 */
export function createPxlsApi(): PxlsApi {
  const settings = useSettings();
  const board = useBoardStore();
  const place = usePlaceStore();
  const template = useTemplateStore();
  const overlays = useOverlaysStore();
  const lookup = useLookupStore();
  const chat = useChatStore();
  const user = useUserStore();
  const query = useQueryStore();
  const ui = useUiStore();
  const modal = useModal();
  const timer = useTimerStore();
  const panels = usePanelsStore();

  const overlayControls = (name: string) => ({
    clear: () => overlays.get(name)?.clear(),
    reload: () => overlays.get(name)?.reload(),
  });

  const api: PxlsApi = {
    version: 1,

    on: (event, handler) => pxlsEvents.subscribe(event, handler as never),

    board: {
      get width() {
        return board.width;
      },
      get height() {
        return board.height;
      },
      get scale() {
        return board.getScale();
      },
      get loaded() {
        return board.loaded;
      },
      get snipMode() {
        return board.snipMode;
      },
      centerOn: (x, y) => board.centerOn(x, y),
      setScale: (scale) => board.setScale(scale),
      getPixel: (x, y) => board.getPixelIndex(x, y),
      fromScreen: (x, y) => board.fromScreen(x, y),
      toScreen: (x, y) => board.toScreen(x, y),
      snapshot: () => board.save(),
    },

    palette: {
      get colors() {
        return place.palette.map((color) => ({ ...color }));
      },
      get selected() {
        return place.color;
      },
      select: (index) => place.switchColor(index),
    },

    template: {
      get options() {
        return { ...template.options };
      },
      update: (options) => template.queueUpdate(options),
      normalize: (options, toOptions = true) => template.normalizeTemplateObj({ ...options }, toOptions),
    },

    overlays: {
      add: (name, fetchData, onLazyInit) => overlays.add(name, fetchData, onLazyInit),
      remove: (name) => overlays.remove(name),
      get: (name) => overlays.get(name),
      heatmap: overlayControls('heatmap'),
      virginmap: overlayControls('virginmap'),
    },

    lookup: {
      registerHook: (...hooks) => lookup.registerHook(...hooks),
      replaceHook: (id, hook) => lookup.replaceHook(id, hook),
      unregisterHook: (id) => lookup.unregisterHook(id),
    },

    chat: {
      registerHook: (...hooks) => chat.registerHook(...hooks),
      replaceHook: (id, hook) => chat.replaceHook(id, hook),
      unregisterHook: (id) => chat.unregisterHook(id),
      getIgnores: () => chat.getIgnores(),
      addIgnore: (name) => chat.addIgnore(name),
      removeIgnore: (name) => chat.removeIgnore(name) !== false,
      processMessage: (raw) => chat.processMessage(raw),
      get markdownProcessor() {
        return chat.legacyApi().markdownProcessor;
      },
    },

    user: {
      get username() {
        return user.username;
      },
      get loggedIn() {
        return user.loggedIn;
      },
      get pixelCount() {
        return user.pixelCount;
      },
      get pixelCountAllTime() {
        return user.pixelCountAllTime;
      },
      get roles() {
        return user.roles;
      },
      get permissions() {
        return [...user.permissions];
      },
      hasPermission: (node) => user.hasPermission(node),
      isStaff: () => user.isStaff(),
      isDonator: () => user.isDonator(),
    },

    cooldown: {
      get ready() {
        return timer.cooledDown();
      },
      get remaining() {
        return Math.max(0, timer.cooldown - Date.now()) / 1000;
      },
      get available() {
        return ui.pixelsAvailable;
      },
      get max() {
        return ui.maxStacked;
      },
    },

    settings,

    query: {
      get: (key) => query.get(key) ?? null,
      set: (key, value) => query.set(key, value),
      has: (key) => query.has(key),
      remove: (key) => query.remove(key),
    },

    panels: {
      open: (panel) => panels.open(panel),
      close: (panel) => panels.close(panel),
      toggle: (panel) => panels.toggle(panel),
      isOpen: (panel) => panels.isOpen(panel),
    },

    ui: {
      alert: (message) => {
        modal.showText(message, { title: useNuxtApp().$i18n.t('Alert'), modalOpts: { closeExisting: false } });
      },
      modal,
      get tabId() {
        return ui.tabId;
      },
      tabHasFocus: () => ui.tabHasFocus(),
      loadTemplateFile: (input) => ui.handleFile(input),
      setAlertSound: (url) => settings.audio.alert.src.set(url),
    },

    storage: {
      local: ls,
      session: ss,
    },
  };

  return Object.freeze(api);
}

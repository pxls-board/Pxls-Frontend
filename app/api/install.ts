import type { PxlsApi } from '~~/shared/pxls-api';
import { createPxlsApi } from './pxls';
import { TH } from '~/utils/typeahead';

type QueueCallback = (pxls: PxlsApi) => void;

// Captured before the anti-bot code replaces the global constructor.
const NativeCustomEvent = window.CustomEvent;

/**
 * Publishes `window.pxls`, runs queued callbacks, fires `pxls:ready`, and sets
 * up the deprecated `window.App` for older userscripts.
 */
export function installPublicApi() {
  const api = createPxlsApi();
  const ban = useBanStore();

  Object.defineProperty(window, 'pxls', { value: api, configurable: false, writable: false });

  const pending = Array.isArray(window.pxlsQueue) ? window.pxlsQueue : [];
  const run = (callback: QueueCallback) => {
    try {
      callback(api);
    } catch (error) {
      console.error('[pxls] userscript callback failed:', error);
    }
  };
  window.pxlsQueue = {
    push(...callbacks: QueueCallback[]) {
      callbacks.forEach(run);
      return 0;
    },
  } as unknown as QueueCallback[];
  pending.forEach(run);

  window.dispatchEvent(new NativeCustomEvent('pxls:ready', { detail: api }));
  pxlsEvents.emit('ready', api);

  installLegacyApp(api);
  window.TH = window.TH || TH;

  // Bots overwrite these before calling them; keep putting the traps back.
  ban.addTrap(() => {
    const app = window.App as Record<string, unknown> | undefined;
    if (!app) return;
    app.attemptPlace = () => ban.me('window.App.attemptPlace');
    app.doPlace = () => ban.me('window.App.doPlace');
  });
}

declare global {
  interface Window {
    App?: unknown;
    TH?: unknown;
    __?: (text: string) => string;
  }
}

let warned = false;
const deprecated = () => {
  if (!warned) {
    warned = true;
    console.warn('[pxls] window.App is deprecated and will be removed. Use window.pxls instead.');
  }
};

/**
 * @deprecated Same shape as the pre-2.0 `window.App`. Use `window.pxls`.
 */
function installLegacyApp(api: PxlsApi) {
  const settings = useSettings();
  const query = useQueryStore();
  const ui = useUiStore();
  const template = useTemplateStore();
  const lookup = useLookupStore();
  const chat = useChatStore();
  const user = useUserStore();
  const overlays = useOverlaysStore();
  const ban = useBanStore();

  const withWarning = <T extends object>(target: T): T =>
    new Proxy(target, {
      get(object, property, receiver) {
        deprecated();
        return Reflect.get(object, property, receiver);
      },
    });

  const legacyChat = chat.legacyApi();

  window.App = withWarning({
    ls,
    ss,
    settings,
    query: {
      init: query.init,
      get: query.get,
      set: query.set,
      has: query.has,
      update: query.update,
      remove: query.remove,
      lazy_update: query.lazy_update,
    },
    overlays: {
      add: overlays.add,
      remove: overlays.remove,
      get heatmap() {
        return api.overlays.heatmap;
      },
      get heatbackground() {
        return { reload: () => overlays.get('heatbackground')?.reload() };
      },
      get virginmap() {
        return api.overlays.virginmap;
      },
      get virginbackground() {
        return { reload: () => overlays.get('virginbackground')?.reload() };
      },
    },
    uiHelper: {
      get tabId() {
        return ui.tabId;
      },
      tabHasFocus: ui.tabHasFocus,
      updateAudio: (url: string) => useTimerStore().setAudioSource(url),
      handleFile: ui.handleFile,
    },
    template: {
      update: (options: Record<string, unknown>) => template.queueUpdate(options),
      normalize: (options: Record<string, unknown>, direction = true) =>
        template.normalizeTemplateObj(options, direction),
    },
    lookup: {
      registerHook: lookup.registerHook,
      replaceHook: lookup.replaceHook,
      unregisterHook: lookup.unregisterHook,
    },
    centerBoardOn: (x: number, y: number) => api.board.centerOn(x, y),
    updateTemplate: (options: Record<string, unknown>) => template.queueUpdate(options),
    alert: (message: string) => api.ui.alert(message),
    doPlace: () => ban.me('call to doPlace()'),
    attemptPlace: () => ban.me('call to attemptPlace()'),
    chat: legacyChat,
    typeahead: legacyChat.typeahead,
    user: {
      getUsername: () => user.username,
      getPixelCount: () => user.pixelCount,
      getPixelCountAllTime: () => user.pixelCountAllTime,
      getRoles: () => user.roles,
      isLoggedIn: () => user.loggedIn,
      isStaff: user.isStaff,
      isDonator: user.isDonator,
      getPermissions: () => [...user.permissions],
      hasPermission: user.hasPermission,
    },
    modal: api.ui.modal,
  });
}

/** Whether something defined `window.App` before us (checked before installing it). */
export function detectInstaban(): boolean {
  return window.App !== undefined;
}

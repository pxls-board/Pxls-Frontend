type MessageListener = (event: { source: MessageEventSource | null; data: Record<string, unknown> }) => void;

const hasSupport = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
const listeners = new Map<string, Set<MessageListener>>();
let isInit = false;
let started = false;

function init() {
  if (!hasSupport || started) return;
  started = true;

  if (navigator.serviceWorker.controller == null) {
    navigator.serviceWorker
      .register('/serviceWorker.js')
      .then(() => {
        isInit = true;
      })
      .catch((error) => console.error('Failed to register Service Worker:', error));
  } else {
    isInit = true;
  }

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as Record<string, unknown> | null;
    if (typeof data !== 'object' || data === null || !('type' in data)) {
      console.warn('Received non-data message from service worker', data);
      return;
    }
    for (const key of [String(data.type), '*']) {
      for (const listener of listeners.get(key) ?? []) {
        listener({ source: event.source, data });
      }
    }
  });
}

function addMessageListener(type: string, listener: MessageListener) {
  let set = listeners.get(type);
  if (!set) {
    set = new Set();
    listeners.set(type, set);
  }
  set.add(listener);
}

function removeMessageListener(type: string, listener: MessageListener) {
  listeners.get(type)?.delete(listener);
}

function postMessage(data: Record<string, unknown>) {
  if (!isInit) return;
  void navigator.serviceWorker.ready.then(({ installing, waiting, active }) => {
    const worker = navigator.serviceWorker.controller ?? installing ?? waiting ?? active;
    worker?.postMessage(data);
  });
}

const serviceWorker = {
  hasSupport,
  init,
  addMessageListener,
  removeMessageListener,
  postMessage,
  get ready() {
    return navigator.serviceWorker.ready.then((registration) => {
      isInit = true;
      return registration;
    });
  },
};

/** Talks to `/serviceWorker.js`, which tracks the focused tab across windows. */
export function useServiceWorker() {
  return serviceWorker;
}

declare global {
  interface Document {
    autoPxlsScriptRevision?: unknown;
    autoPxlsScriptRevision_?: unknown;
    autoPxlsRandomNumber?: unknown;
    RN?: unknown;
    defaultCaptchaFaviconSource?: unknown;
  }
}

const BAD_SOURCES = [
  /^https?:\/\/[^/]*raw[^/]*git[^/]*\/(metonator|Deklost|NomoX|RogerioBlanco)/i,
  /.*pxlsbot(\.min)?\.js/i,
  /^chrome-extension:\/\/lmleofkkoohkbgjikogbpmnjmpdedfil/i,
  /^https?:\/\/.*mlpixel\.org/i,
];
const BAD_EVENTS = ['mousedown', 'mouseup', 'click'];

// Globals set by known bots.
const BAD_WINDOW_GLOBALS = [
  'AutoPXLS',
  'AutoPXLS2',
  'CFS',
  'xD',
  'vdk',
  'Notabot',
  'Botnet',
  'DrawIt',
  'NomoXBot',
  'UBot',
];
const BAD_DOCUMENT_GLOBALS = [
  'autoPxlsScriptRevision',
  'autoPxlsScriptRevision_',
  'autoPxlsRandomNumber',
  'RN',
  'defaultCaptchaFaviconSource',
] as const;
const BAD_SELECTORS = ['#autopxlsinfo', '.botpanel', '.xbotpanel', '.botalert', '#restartbot'];

/** Detects automated placement tools and reports them to the server. */
export const useBanStore = defineStore('ban', () => {
  const socket = useSocket();
  const traps: Array<() => void> = [];

  function shadow(reason: string) {
    socket.send(JSON.stringify({ type: 'shadowbanme', reason }));
  }

  function me(reason: string) {
    socket.send(JSON.stringify({ type: 'banme', reason }));
    socket.close();
    window.location.href = 'https://www.youtube.com/watch?v=QHvKSo4BFi0';
  }

  function checkSrc(src: string) {
    BAD_SOURCES.forEach((pattern, i) => {
      if (pattern.test(src)) shadow(`checkSrc pattern #${i}`);
    });
  }

  function wrapEventConstructor<T extends new (type: string, init?: EventInit) => Event>(
    name: 'Event' | 'CustomEvent',
    original: T,
  ) {
    const wrapped = function (type: string, init?: EventInit) {
      if (BAD_EVENTS.includes(String(type).toLowerCase())) {
        shadow(`bad ${name} ${String(type).toLowerCase()}`);
      }
      return new original(type, init);
    } as unknown as T;
    // Keep `instanceof Event` working for libraries.
    wrapped.prototype = original.prototype;
    return wrapped;
  }

  /** Re-applied periodically: bots overwrite these before calling them. */
  function refreshTraps() {
    for (const trap of traps) trap();

    for (const name of BAD_WINDOW_GLOBALS) {
      if ((window as unknown as Record<string, unknown>)[name] != null) shadow(`window.${name}`);
    }
    for (const name of BAD_DOCUMENT_GLOBALS) {
      if (document[name] != null) shadow(`document.${name}`);
    }
    for (const selector of BAD_SELECTORS) {
      if (document.querySelector(selector)) shadow(selector);
    }
  }

  function init() {
    setInterval(refreshTraps, 5000);

    // Don't even try to generate mouse events.
    const w = window as unknown as Record<string, unknown>;
    w.MouseEvent = function () {
      me('new MouseEvent instance');
    };
    w.Event = wrapEventConstructor('Event', window.Event);
    w.CustomEvent = wrapEventConstructor('CustomEvent', window.CustomEvent);

    const createEvent = document.createEvent.bind(document);
    document.createEvent = ((eventInterface: string) => {
      if (BAD_EVENTS.includes(eventInterface.toLowerCase())) {
        shadow(`bad document.createEvent ${eventInterface.toLowerCase()}`);
      }
      return createEvent(eventInterface);
    }) as typeof document.createEvent;

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLScriptElement) checkSrc(node.src);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.querySelectorAll('script').forEach((script) => checkSrc(script.src));
  }

  return {
    init,
    shadow,
    me,
    addTrap: (trap: () => void) => traps.push(trap),
  };
});

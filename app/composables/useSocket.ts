import type { SocketMessage, SocketMessageType } from '~/types/pxls';

type Handler<T extends SocketMessageType> = (message: SocketMessage<T>) => void;

// Keep references to the real implementations; bots like to monkey-patch these.
const nativeSend = WebSocket.prototype.send;
const nativeClose = WebSocket.prototype.close;

const reconnecting = ref(false);
const hooks = new Map<string, Set<Handler<never>>>();
const sendQueue: string[] = [];
let ws: WebSocket | null = null;
let initialized = false;

function socketUrl() {
  const { protocol, host } = window.location;
  return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}/ws`;
}

function connect() {
  ws = new WebSocket(socketUrl());
  ws.onopen = () => {
    setTimeout(() => {
      while (sendQueue.length > 0) {
        send(sendQueue.shift()!);
      }
    }, 0);
  };
  ws.onmessage = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as SocketMessage;
    const handlers = hooks.get(data.type);
    if (handlers) {
      for (const handler of handlers) {
        (handler as Handler<typeof data.type>)(data);
      }
    }
  };
  ws.onclose = () => reconnect();
}

/** Waits for the server to come back, then reloads the page. */
function reconnect() {
  reconnecting.value = true;
  setTimeout(async () => {
    try {
      const response = await fetch('/info');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      window.location.reload();
    } catch {
      console.info('Server still down...');
      reconnect();
    }
  }, 5000);
}

/** Opens a fresh connection (after logging in or out) without reloading. */
function reconnectSocket() {
  if (ws) ws.onclose = null;
  close();
  connect();
}

function close() {
  if (!ws) return;
  nativeClose.call(ws);
}

function send(payload: string | object) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    sendQueue.push(data);
  } else {
    nativeSend.call(ws, data);
  }
}

function on<T extends SocketMessageType>(type: T, handler: Handler<T>): () => void {
  let set = hooks.get(type);
  if (!set) {
    set = new Set();
    hooks.set(type, set);
  }
  set.add(handler as Handler<never>);
  return () => set.delete(handler as Handler<never>);
}

function init() {
  if (initialized) return;
  initialized = true;
  connect();
  window.addEventListener('beforeunload', () => {
    if (ws) ws.onclose = null;
    close();
  });
}

const socket = { init, on, send, close, reconnect, reconnectSocket, reconnecting: readonly(reconnecting) };

export type PxlsSocket = typeof socket;

export function useSocket(): PxlsSocket {
  return socket;
}

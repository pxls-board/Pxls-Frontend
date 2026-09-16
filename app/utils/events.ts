import mitt from 'mitt';
import type { ChatPacket, SocketMessages } from '~/types/pxls';

export interface QueryUpdate {
  propName: string;
  oldValue: string | null | undefined;
  newValue: string | null;
}

export interface TemplateOptionsEvent {
  use: boolean;
  url: string;
  x: number;
  y: number;
  width: number;
  title: string;
  convertMode: string;
}

/** App-wide events. Also re-dispatched on `window` as `pxls:<name>` CustomEvents. */
export type PxlsEvents = {
  'pixel': SocketMessages['pixel']['pixels'][number];
  'pixels': SocketMessages['pixels'];
  'chat': ChatPacket;
  'userinfo': SocketMessages['userinfo'];
  'cooldown': SocketMessages['cooldown'];
  'template': TemplateOptionsEvent;
  'queryUpdated': QueryUpdate;
  'panel:opened': string;
  'panel:closed': string;
  'ack:place': { x: number; y: number };
  'ack:undo': { x: number; y: number };
  'user:loginState': boolean;
  'pixelCounts:update': SocketMessages['pixelCounts'];
  'chat:userIgnored': string;
  'chat:userUnignored': string;
  'ready': unknown;
};

// Captured before the anti-bot code in `ban` replaces the global constructor.
const NativeCustomEvent = window.CustomEvent;

const emitter = mitt<PxlsEvents>();

export const pxlsEvents = {
  on: emitter.on,
  off: emitter.off,
  emit<K extends keyof PxlsEvents>(type: K, payload: PxlsEvents[K]) {
    emitter.emit(type, payload);
    window.dispatchEvent(new NativeCustomEvent(`pxls:${type}`, { detail: payload }));
  },
  /** Subscribes and returns an unsubscribe function. */
  subscribe<K extends keyof PxlsEvents>(type: K, handler: (payload: PxlsEvents[K]) => void) {
    emitter.on(type, handler);
    return () => emitter.off(type, handler);
  },
};

/**
 * Public userscript API for pxls.space (`window.pxls`).
 *
 * This file is self-contained and published at `/pxls-api.d.ts`. Reference it
 * from a userscript with:
 *
 *   /// <reference path="https://pxls.space/pxls-api.d.ts" />
 *
 * The app finishes loading asynchronously, so wait for it with the queue:
 *
 *   (window.pxlsQueue ??= []).push((pxls) => { ... });
 *
 * or the event: `window.addEventListener('pxls:ready', (e) => e.detail)`.
 */

export interface PxlsPaletteColor {
  name: string;
  /** Hex without `#`. */
  value: string;
}

export interface PxlsBadge {
  displayName: string;
  tooltip: string;
  type: 'text' | 'icon';
  cssIcon?: string;
}

export interface PxlsFaction {
  id: number;
  name: string;
  tag: string;
  color: number;
}

export interface PxlsChatMessage {
  id: number;
  author: string;
  /** Unix seconds. */
  date: number;
  message_raw: string;
  purge?: { initiator: string; reason: string } | null;
  badges: PxlsBadge[];
  authorNameColor: number;
  authorWasShadowBanned?: boolean;
  strippedFaction?: PxlsFaction | null;
  replyingToId: number;
  replyShouldMention: boolean;
}

export interface PxlsRole {
  id: string;
  name: string;
  guest: boolean;
  defaultRole: boolean;
  inherits: PxlsRole[];
  badges: PxlsBadge[];
  permissions: string[];
}

export interface PxlsUserInfo {
  username: string;
  pixelCount: number;
  pixelCountAllTime: number;
  placementOverrides: { ignoreCooldown: boolean; canPlaceAnyColor: boolean; ignorePlacemap: boolean };
  chatNameColor: number;
  roles: PxlsRole[];
  renameRequested: boolean;
  discordName: string | null;
  method: string;
  banExpiry: number;
  banned: boolean;
  banReason: string;
}

export interface PxlsTemplateOptions {
  use: boolean;
  url: string;
  x: number;
  y: number;
  /** Display width in board pixels; -1 means the image's own width. */
  width: number;
  title: string;
  convertMode: 'unconverted' | 'nearestCustom';
  style: string | undefined;
}

/** Template update. URL-style keys (`template`, `ox`, `oy`, `tw`, `convert`) are accepted too. */
export type PxlsTemplateUpdate = Partial<
  Record<keyof PxlsTemplateOptions | 'template' | 'ox' | 'oy' | 'tw' | 'convert', unknown>
>;

export interface PxlsLookupData {
  id?: number;
  x: number;
  y: number;
  /** The pixel is part of the background (not placed by a user). */
  bg?: boolean;
  username?: string;
  faction?: string;
  origin?: string;
  time?: number;
  pixelCount?: number;
  pixelCountAlltime?: number;
  discordName?: string;
  [key: string]: unknown;
}

export interface PxlsLookupHook {
  id: string;
  /** User-facing label. */
  name: string;
  /** Hidden when "Hide sensitive information" is on. */
  sensitive: boolean;
  /** Also shown for background pixels. */
  backgroundCompatible: boolean;
  /** Text or a DOM node to show; `null` hides the row. */
  get: (data: PxlsLookupData) => string | number | Node | null | undefined;
  /** CSS applied to the value. */
  css: Record<string, string>;
}

export interface PxlsChatHook {
  id: string;
  /** Returning a non-empty `pings` array highlights the message as a ping. */
  get: (message: PxlsChatMessage) => { pings?: unknown[] } | undefined;
}

export interface PxlsOverlay {
  readonly name: string;
  readonly isShown: boolean;
  readonly canvas: HTMLCanvasElement;
  setPixel(x: number, y: number, color: string): void;
  getImageData(): ImageData | null;
  setImageData(data: ImageData): void;
  clear(): void;
  setOpacity(opacity: number): void;
  show(): void;
  hide(): void;
  toggle(): void;
  setShown(value?: boolean): void;
  remove(): void;
  reload(): void;
  setPixelated(pixelated?: boolean): void;
}

export interface PxlsSetting<T> {
  readonly name: string;
  readonly defaultValue: T;
  get(): T;
  set(value: T): void;
  reset(): void;
  /** Calls `listener` immediately and on every change. */
  listen(listener: (value: T) => void): void;
  unlisten(listener: (value: T) => void): void;
  /** Toggles boolean settings. */
  toggle(): void;
}

type Toggle = PxlsSetting<boolean>;
type Num = PxlsSetting<number>;
type Str = PxlsSetting<string>;

export interface PxlsSettings {
  ui: {
    language: { override: Str };
    theme: { index: Str };
    reticule: { enable: Toggle };
    cursor: { enable: Toggle };
    bubble: { position: Str; animation: Str; compact: Toggle };
    brightness: { enable: Toggle; value: Num };
    palette: {
      numbers: { enable: Toggle };
      scrollbar: { thin: { enable: Toggle } };
      stacking: { enable: Toggle };
    };
    chat: {
      banner: { enable: Toggle };
      horizontal: { enable: Toggle };
      icon: { badge: Str; color: Str };
    };
  };
  audio: { enable: Toggle; alert: { src: Str; volume: Num } };
  board: {
    heatmap: { enable: Toggle; opacity: Num };
    virginmap: { enable: Toggle; opacity: Num };
    grid: { enable: Toggle };
    lock: { enable: Toggle };
    zoom: { sensitivity: Num; limit: { minimum: Num; maximum: Num }; rounding: { enable: Toggle } };
    template: { beneathoverlays: Toggle; opacity: Num; style: { source: Str; customsource: Str } };
    snapshot: { format: Str };
  };
  place: {
    notification: { enable: Toggle };
    deselectonplace: { enable: Toggle };
    palette: { scrolling: { enable: Toggle; invert: Toggle } };
    picker: { enable: Toggle };
    rightclick: { action: Str };
    alert: { delay: Num };
  };
  lookup: { filter: { sensitive: { enable: Toggle } } };
  chat: {
    enable: Toggle;
    timestamps: { '24h': Toggle };
    badges: { enable: Toggle };
    factiontags: { enable: Toggle };
    pings: { enable: Toggle; audio: { when: Str; volume: Num } };
    links: { templates: { preferurls: Toggle }; internal: { behavior: Str }; external: { skip: Toggle } };
    font: { size: Num };
    truncate: { max: Num };
  };
  fix: { chrome: { offset: { enable: Toggle } } };
}

export interface PxlsStorage {
  get<T = unknown>(name: string): T | null;
  has(name: string): boolean;
  set(name: string, value: unknown): void;
  remove(name: string): void;
}

export interface PxlsModal {
  /** Shows a DOM element as a dialog. */
  show(element: HTMLElement, options?: PxlsModalOptions): { close(): void };
  showText(text: string, options?: { title?: string; modalOpts?: PxlsModalOptions }): { close(): void };
  /** Builds a dialog element from header/body/footer content for `show`. */
  buildDom(header?: unknown, body?: unknown, footer?: unknown): HTMLElement;
  closeTop(): void;
  closeAll(): void;
}

export interface PxlsModalOptions {
  closeExisting?: boolean;
  escapeClose?: boolean;
  clickClose?: boolean;
}

export type PxlsPanel = 'info' | 'faq' | 'notifications' | 'settings' | 'chat';

export interface PxlsEventMap {
  /** A pixel changed on the board. */
  'pixel': { x: number; y: number; color: number };
  /** Your available pixel count changed. */
  'pixels': { count: number; cause: string };
  'chat': PxlsChatMessage;
  'userinfo': PxlsUserInfo;
  /** Seconds until the next pixel. */
  'cooldown': { wait: number };
  'template': Omit<PxlsTemplateOptions, 'style'>;
  'queryUpdated': { propName: string; oldValue: string | null | undefined; newValue: string | null };
  'panel:opened': string;
  'panel:closed': string;
  'ack:place': { x: number; y: number };
  'ack:undo': { x: number; y: number };
  'user:loginState': boolean;
  'pixelCounts:update': { pixelCount: number; pixelCountAllTime: number };
  'chat:userIgnored': string;
  'chat:userUnignored': string;
  'ready': PxlsApi;
}

export interface PxlsApi {
  readonly version: 1;

  /** Subscribes to an event. Returns a function that unsubscribes. */
  on<K extends keyof PxlsEventMap>(event: K, handler: (payload: PxlsEventMap[K]) => void): () => void;

  board: {
    readonly width: number;
    readonly height: number;
    readonly scale: number;
    readonly loaded: boolean;
    readonly snipMode: boolean;
    centerOn(x: number, y: number): void;
    setScale(scale: number): void;
    /** Palette index at a position (255 = transparent/unknown). */
    getPixel(x: number, y: number): number;
    fromScreen(clientX: number, clientY: number): { x: number; y: number };
    toScreen(x: number, y: number): { x: number; y: number };
    /** Downloads a snapshot of the board. */
    snapshot(): void;
  };

  palette: {
    readonly colors: PxlsPaletteColor[];
    /** Selected palette index, or -1. */
    readonly selected: number;
    select(index: number): void;
  };

  template: {
    readonly options: PxlsTemplateOptions;
    update(options: PxlsTemplateUpdate): void;
    /** Converts URL-style keys to option keys (or back with `toOptions = false`). */
    normalize<T extends Record<string, unknown>>(options: T, toOptions?: boolean): T;
  };

  overlays: {
    add(
      name: string,
      fetchData: () => Promise<ImageData>,
      onLazyInit?: (width: number, height: number, isReload: boolean) => void,
    ): PxlsOverlay;
    remove(name: string): void;
    get(name: string): PxlsOverlay | undefined;
    heatmap: { clear(): void; reload(): void };
    virginmap: { clear(): void; reload(): void };
  };

  lookup: {
    registerHook(...hooks: Partial<PxlsLookupHook>[]): number;
    replaceHook(id: string, hook: Partial<PxlsLookupHook>): void;
    unregisterHook(id: string): void;
  };

  chat: {
    registerHook(...hooks: Partial<PxlsChatHook>[]): number;
    replaceHook(id: string, hook: Partial<PxlsChatHook>): void;
    unregisterHook(id: string): void;
    getIgnores(): string[];
    addIgnore(username: string): boolean;
    removeIgnore(username: string): boolean;
    /** Renders chat markdown to DOM nodes. */
    processMessage(raw: string): Node[];
    /** The pxlsMarkdown processor; extend it with `.use(plugin)`. */
    readonly markdownProcessor: unknown;
  };

  user: {
    readonly username: string;
    readonly loggedIn: boolean;
    readonly pixelCount: number | null;
    readonly pixelCountAllTime: number | null;
    readonly roles: PxlsRole[];
    readonly permissions: string[];
    hasPermission(node: string): boolean;
    isStaff(): boolean;
    isDonator(): boolean;
  };

  cooldown: {
    /** Whether a pixel can be placed now. */
    readonly ready: boolean;
    /** Seconds until the next pixel. */
    readonly remaining: number;
    readonly available: number;
    readonly max: number;
  };

  settings: PxlsSettings;

  /** The URL hash parameters (`#x=…&y=…&template=…`). */
  query: {
    get(key: string): string | null;
    set(key: string, value: unknown): void;
    has(key: string): boolean;
    remove(key: string): void;
  };

  panels: {
    open(panel: PxlsPanel): void;
    close(panel: PxlsPanel): void;
    toggle(panel: PxlsPanel): void;
    isOpen(panel: PxlsPanel): boolean;
  };

  ui: {
    alert(message: string): void;
    modal: PxlsModal;
    readonly tabId: string | number | null;
    /** Whether this is the most recently focused pxls tab. */
    tabHasFocus(): boolean;
    /** Loads the first file of an `<input type=file>` as the template. */
    loadTemplateFile(input: { files: FileList | null }): void;
    setAlertSound(url: string): void;
  };

  storage: {
    local: PxlsStorage;
    session: PxlsStorage;
  };
}

declare global {
  interface Window {
    pxls?: PxlsApi;
    /** Callbacks run once the API is ready; pushing after that runs them immediately. */
    pxlsQueue?: Array<(pxls: PxlsApi) => void> | { push(callback: (pxls: PxlsApi) => void): number };
  }

  interface WindowEventMap {
    'pxls:ready': CustomEvent<PxlsApi>;
  }
}

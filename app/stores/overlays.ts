export interface Overlay {
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

type FetchOverlayData = () => Promise<ImageData>;
type OnLazyInit = (width: number, height: number, isReload: boolean) => void;

/** Canvas layers drawn over the board (heatmap, virginmap, and userscript overlays). */
export const useOverlaysStore = defineStore('overlays', () => {
  const overlays = shallowReactive(new Map<string, Overlay>());
  /** Reactive view state per overlay for `Board.vue`. */
  const state = reactive<Record<string, { shown: boolean; opacity: number; pixelated: boolean }>>({});

  function createOverlay(name: string, fetchData: FetchOverlayData, onLazyInit: OnLazyInit = () => {}): Overlay {
    const ui = useUiStore();
    const canvas = markRaw(document.createElement('canvas'));
    canvas.id = name;
    let ctx: CanvasRenderingContext2D | null = null;
    let width = 0;
    let height = 0;
    let shown = false;
    let previouslyInited = false;
    let initStarted = false;
    let initDone = false;

    state[name] = { shown: false, opacity: 1, pixelated: true };

    async function lazyInit() {
      if (initStarted) return;
      initStarted = true;
      const imageData = await fetchData();
      canvas.width = width = imageData.width;
      canvas.height = height = imageData.height;
      ctx = canvas.getContext('2d');
      if (ctx) ctx.imageSmoothingEnabled = false;
      overlay.setImageData(imageData);
      initDone = true;
      onLazyInit(width, height, previouslyInited);
      previouslyInited = true;
      ui.setLoadingBubbleState(name, false);
      overlay.setShown();
    }

    const overlay: Overlay = {
      name,
      canvas,
      get isShown() {
        return shown;
      },
      setPixel(x, y, color) {
        if (!ctx) return;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      },
      getImageData: () => ctx?.getImageData(0, 0, width, height) ?? null,
      setImageData(data) {
        ctx?.putImageData(data, 0, 0);
      },
      clear() {
        if (initDone) overlay.setImageData(createImageData(width, height));
      },
      setOpacity(opacity) {
        state[name]!.opacity = opacity;
      },
      show: () => overlay.setShown(true),
      hide: () => overlay.setShown(false),
      toggle: () => overlay.setShown(!shown),
      setShown(value = shown) {
        shown = value === true;
        if (shown && !initStarted) {
          void lazyInit();
        }
        if (!initDone) {
          ui.setLoadingBubbleState(name, shown);
          return;
        }
        state[name]!.shown = shown;
      },
      remove() {
        overlays.delete(name);
        delete state[name];
      },
      reload() {
        if (initStarted && !initDone) return;
        initStarted = initDone = false;
        void lazyInit();
      },
      setPixelated(pixelated = true) {
        state[name]!.pixelated = pixelated;
      },
    };
    return overlay;
  }

  function add(name: string, fetchData: FetchOverlayData, onLazyInit?: OnLazyInit): Overlay {
    if (overlays.has(name)) {
      throw new Error(`Overlay '${name}' already exists.`);
    }
    const overlay = markRaw(createOverlay(name, fetchData, onLazyInit));
    overlays.set(name, overlay);
    return overlay;
  }

  function remove(name: string) {
    overlays.get(name)?.remove();
  }

  function setAllPixelated(pixelated: boolean) {
    for (const overlay of overlays.values()) {
      overlay.setPixelated(pixelated);
    }
  }

  function webinit(width: number, height: number, heatmapCooldown: number) {
    const settings = useSettings();

    async function createOverlayImageData(
      fetchOverlay: () => Promise<Uint8Array>,
      fetchPlacemap: () => Promise<Uint8Array>,
      color: number,
      xor = 0,
    ) {
      const [overlayData, placemapData] = await Promise.all([fetchOverlay(), fetchPlacemap()]);
      const imageData = createImageData(width, height);
      const view = new Uint32Array(imageData.data.buffer);
      for (let i = 0; i < width * height; i++) {
        // The data byte becomes the alpha channel of `color`.
        view[i] = placemapData[i] === 255 ? 0 : (((overlayData[i]! ^ xor) << 24) | color) >>> 0;
      }
      return imageData;
    }

    const fetchVirginmap = lazy(() => binaryAjax('/virginmap'));
    const fetchHeatmap = lazy(() => binaryAjax('/heatmap'));
    const fetchPlacemap = lazy(() => binaryAjax('/placemap'));

    // Virginmap
    const virginbackground = add('virginbackground', () =>
      createOverlayImageData(fetchVirginmap, fetchPlacemap, 0x0000ff00, 0x00),
    );
    const virginmap = add(
      'virginmap',
      () => createOverlayImageData(fetchVirginmap, fetchPlacemap, 0x00000000, 0xff),
      (_w, _h, isReload) => {
        if (isReload) return;
        pxlsEvents.on('pixel', (pixel) => virginmap.setPixel(pixel.x, pixel.y, '#000000'));
      },
    );
    settings.board.virginmap.opacity.listen((value) => virginbackground.setOpacity(value));
    settings.board.virginmap.enable.listen((value) => {
      virginmap.setShown(value);
      virginbackground.setShown(value);
    });

    // Heatmap
    const heatbackground = add('heatbackground', () => createOverlayImageData(fetchHeatmap, fetchPlacemap, 0xff000000));
    const heatmap = add(
      'heatmap',
      () => createOverlayImageData(fetchHeatmap, fetchPlacemap, 0x005c5ccd),
      (overlayWidth, overlayHeight, isReload) => {
        if (isReload) return;
        setInterval(
          () => {
            const imageData = heatmap.getImageData();
            if (!imageData) return;
            const view = new Uint32Array(imageData.data.buffer);
            for (let i = 0; i < overlayWidth * overlayHeight; i++) {
              let opacity = view[i]! >>> 24;
              if (opacity) {
                opacity--;
                view[i] = ((opacity << 24) | 0x005c5ccd) >>> 0;
              }
            }
            heatmap.setImageData(imageData);
          },
          (heatmapCooldown * 1000) / 256,
        );
        pxlsEvents.on('pixel', (pixel) => heatmap.setPixel(pixel.x, pixel.y, '#CD5C5C'));
      },
    );
    settings.board.heatmap.opacity.listen((value) => heatbackground.setOpacity(value));
    settings.board.heatmap.enable.listen((value) => {
      heatmap.setShown(value);
      heatbackground.setShown(value);
    });
  }

  return {
    overlays,
    state,
    add,
    remove,
    webinit,
    setAllPixelated,
    get: (name: string) => overlays.get(name),
  };
});

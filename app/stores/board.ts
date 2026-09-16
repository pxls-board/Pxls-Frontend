import type { WebInfo } from '~/types/pxls';

export interface BoardElements {
  container: HTMLElement;
  zoomer: HTMLElement;
  mover: HTMLElement;
  /** The canvas holding the board image. */
  board: HTMLCanvasElement;
  /** Full-viewport canvas used when CSS pixelated scaling isn't available. */
  render: HTMLCanvasElement | null;
}

/** Renders the board and owns pan/zoom. DOM elements come from `Board.vue`. */
export const useBoardStore = defineStore('board', () => {
  const flags = browserFlags();
  const useJsRender = !flags.haveImageRendering && !flags.haveZoomRendering;
  const useZoom = !flags.haveImageRendering && flags.haveZoomRendering;

  const width = ref(0);
  const height = ref(0);
  const scale = ref(1);
  const pan = reactive({ x: 0, y: 0 });
  const loaded = ref(false);
  const allowDrag = ref(true);
  const webInfo = shallowRef<WebInfo | null>(null);
  /** Bumped on every view update so screen-space UI (reticule, grid) re-renders. */
  const viewVersion = ref(0);
  const pixelated = ref(true);
  const moverStyle = reactive<Record<string, string>>({});
  const zoomerStyle = reactive<Record<string, string>>({});

  let elements: BoardElements | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let imageData: ImageData | null = null;
  let intView: Uint32Array | null = null;
  let rgbPalette: Uint32Array<ArrayBufferLike> = new Uint32Array();
  let pixelBuffer: { x: number; y: number; c: number }[] = [];
  let pannedWithKeys = false;

  const snipMode = computed(() => webInfo.value?.snipMode === true);

  function attach(els: BoardElements) {
    elements = els;
    ctx = els.board.getContext('2d');
  }

  function detach() {
    elements = null;
    ctx = null;
  }

  function getScale() {
    return Math.abs(scale.value);
  }

  function setPaletteColors(abgr: Uint32Array<ArrayBufferLike>) {
    rgbPalette = abgr;
  }

  function setPixelIndexRaw(index: number, color: number) {
    if (!intView) return;
    intView[index] = color === -1 || color === 0xff ? 0 : (rgbPalette[color] ?? 0);
  }

  function draw(data: Uint8Array) {
    if (!ctx) return;
    imageData = createImageData(width.value, height.value);
    ctx.imageSmoothingEnabled = false;
    intView = new Uint32Array(imageData.data.buffer);

    const total = width.value * height.value;
    for (let i = 0; i < total; i++) {
      setPixelIndexRaw(i, data[i]!);
    }
    ctx.putImageData(imageData, 0, 0);
    update();
    loaded.value = true;
    replayBuffer();
  }

  function replayBuffer() {
    for (const pixel of pixelBuffer) {
      setPixelIndex(pixel.x, pixel.y, pixel.c, false);
    }
    refresh();
    pixelBuffer = [];
  }

  function setPixelIndex(x: number, y: number, color: number, doRefresh = true) {
    if (!loaded.value) {
      pixelBuffer.push({ x, y, c: color });
      return;
    }
    setPixelIndexRaw(y * width.value + x, color);
    if (doRefresh) refresh();
  }

  function getPixelIndex(x: number, y: number): number {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!loaded.value || !intView) {
      return pixelBuffer.findIndex((pixel) => pixel.x === x && pixel.y === y);
    }
    const index = rgbPalette.indexOf(intView[y * width.value + x]!);
    return index !== -1 ? index : 0xff;
  }

  function refresh() {
    if (loaded.value && ctx && imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  }

  function centerOn(x: number | null | undefined, y: number | null | undefined, ignoreLock = false) {
    if (x != null && !Number.isNaN(Number(x))) pan.x = width.value / 2 - Number(x);
    if (y != null && !Number.isNaN(Number(y))) pan.y = height.value / 2 - Number(y);
    update(false, ignoreLock);
  }

  function updateViewport(data: { x?: number; y?: number; scale?: number | string }) {
    const parsed = parseFloat(String(data.scale));
    if (!Number.isNaN(parsed)) {
      setScale(parsed, false);
    }
    centerOn(data.x, data.y);
  }

  function setScale(value: number | string, doUpdate = true) {
    const settings = useSettings();
    const minimum = settings.board.zoom.limit.minimum.get();
    const maximum = settings.board.zoom.limit.maximum.get();
    let next = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(next)) return;

    if (next > maximum) {
      next = maximum;
    } else if (next <= minimum) {
      next = minimum;
    }

    if (settings.board.zoom.rounding.enable.get()) {
      // Round up when zooming in and down when zooming out so the level always changes.
      const round = next < scale.value ? Math.floor : Math.ceil;
      if (next > 1) {
        next = scale.value < 1 ? 1 : round(next);
      } else {
        next = scale.value > 1 ? 1 : 2 ** round(Math.log(next) / Math.log(2));
      }
    }

    scale.value = next;
    if (doUpdate) update();
  }

  function nudgeScale(adjustment: number) {
    const base = useSettings().board.zoom.sensitivity.get() || 1.5;
    setScale(scale.value * base ** adjustment);
  }

  /**
   * Re-applies pan/zoom. With `optional`, only the JS renderer redraws.
   * Returns whether anything was rendered.
   */
  function update(optional = false, ignoreCanvasLock = false): boolean {
    const currentScale = getScale();
    if (loaded.value) {
      pan.x = clamp(pan.x, -width.value / 2, width.value / 2);
      pan.y = clamp(pan.y, -height.value / 2, height.value / 2);
      useQueryStore().set(
        {
          x: Math.round(width.value / 2 - pan.x),
          y: Math.round(height.value / 2 - pan.y),
          scale: Math.round(currentScale * 100) / 100,
        },
        true,
      );
    }

    if (useJsRender && elements?.render) {
      renderToViewport(elements.render, currentScale);
      viewVersion.value++;
      return true;
    }
    if (optional) {
      return false;
    }

    pixelated.value = currentScale > 1;

    if (ignoreCanvasLock || allowDrag.value || pannedWithKeys) {
      const px = currentScale <= 1 ? Math.round(pan.x) : pan.x;
      const py = currentScale <= 1 ? Math.round(pan.y) : pan.y;
      moverStyle.width = `${width.value}px`;
      moverStyle.height = `${height.value}px`;
      moverStyle.transform = `translate(${px}px, ${py}px)`;
    }
    if (useZoom) {
      zoomerStyle.zoom = `${currentScale * 100}%`;
    } else {
      zoomerStyle.transform = `scale(${currentScale})`;
    }

    viewVersion.value++;
    return true;
  }

  function renderToViewport(target: HTMLCanvasElement, currentScale: number) {
    if (!elements) return;
    const ctx2 = target.getContext('2d');
    if (!ctx2) return;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    let pxlX = -pan.x + (width.value - viewWidth / currentScale) / 2;
    let pxlY = -pan.y + (height.value - viewHeight / currentScale) / 2;
    let dx = 0;
    let dy = 0;
    let dw = 0;
    let dh = 0;
    let pxlW = viewWidth / currentScale;
    let pxlH = viewHeight / currentScale;

    if (pxlX < 0) {
      dx = -pxlX;
      pxlX = 0;
      pxlW -= dx;
      dw += dx;
    }
    if (pxlY < 0) {
      dy = -pxlY;
      pxlY = 0;
      pxlH -= dy;
      dh += dy;
    }
    if (pxlX + pxlW > width.value) {
      dw += pxlW + pxlX - width.value;
      pxlW = width.value - pxlX;
    }
    if (pxlY + pxlH > height.value) {
      dh += pxlH + pxlY - height.value;
      pxlH = height.value - pxlY;
    }

    ctx2.canvas.width = viewWidth;
    ctx2.canvas.height = viewHeight;
    ctx2.imageSmoothingEnabled = currentScale < 1;
    ctx2.globalAlpha = 1;
    ctx2.fillStyle = '#CCCCCC';
    ctx2.fillRect(0, 0, viewWidth, viewHeight);
    ctx2.drawImage(
      elements.board,
      pxlX,
      pxlY,
      pxlW,
      pxlH,
      dx * currentScale,
      dy * currentScale,
      viewWidth - dw * currentScale,
      viewHeight - dh * currentScale,
    );

    useTemplateStore().drawOnto(ctx2, pxlX, pxlY);
  }

  function boardRect(): DOMRect | null {
    return elements?.board.getBoundingClientRect() ?? null;
  }

  function fromScreen(screenX: number, screenY: number, floored = true) {
    const currentScale = getScale();
    const adjustX = scale.value < 0 ? width.value : 0;
    const adjustY = scale.value < 0 ? height.value : 0;
    let result = { x: 0, y: 0 };

    if (useJsRender) {
      result = {
        x: -pan.x + (width.value - window.innerWidth / currentScale) / 2 + screenX / currentScale + adjustX,
        y: -pan.y + (height.value - window.innerHeight / currentScale) / 2 + screenY / currentScale + adjustY,
      };
    } else {
      const rect = boardRect();
      if (rect) {
        result = useZoom
          ? {
              x: screenX / currentScale - rect.left + adjustX,
              y: screenY / currentScale - rect.top + adjustY,
            }
          : {
              x: (screenX - rect.left) / currentScale + adjustX,
              y: (screenY - rect.top) / currentScale + adjustY,
            };
      }
    }

    if (floored) {
      result.x = Math.floor(result.x);
      result.y = Math.floor(result.y);
    }
    return result;
  }

  function toScreen(boardX: number, boardY: number) {
    const currentScale = getScale();
    if (useJsRender) {
      return {
        x: (boardX + pan.x - (width.value - window.innerWidth / currentScale) / 2) * currentScale,
        y: (boardY + pan.y - (height.value - window.innerHeight / currentScale) / 2) * currentScale,
      };
    }
    const rect = boardRect();
    if (!rect) return { x: 0, y: 0 };
    if (useZoom) {
      return {
        x: (boardX + rect.left) * currentScale,
        y: (boardY + rect.top) * currentScale,
      };
    }
    return {
      x: boardX * currentScale + rect.left,
      y: boardY * currentScale + rect.top,
    };
  }

  /** Pans the board by a screen-space delta (drag gestures). */
  function panBy(dx: number, dy: number) {
    if (!allowDrag.value) return;
    pan.x += dx / scale.value;
    pan.y += dy / scale.value;
    update();
  }

  /** Pans by a fixed amount (keyboard). Works even when the canvas is locked. */
  function panByKeys(dx: number, dy: number) {
    pan.x += dx / scale.value;
    pan.y += dy / scale.value;
    pannedWithKeys = true;
    update();
  }

  /** Zooms around a screen point (mouse wheel / pinch). */
  function zoomAt(clientX: number, clientY: number, apply: () => void) {
    if (!elements) return;
    const oldScale = getScale();
    apply();
    const newScale = getScale();
    if (oldScale !== newScale) {
      const dx = clientX - elements.container.clientWidth / 2;
      const dy = clientY - elements.container.clientHeight / 2;
      pan.x += dx / newScale - dx / oldScale;
      pan.y += dy / newScale - dy / oldScale;
      update();
    }
  }

  function save() {
    if (!elements) return;
    const format = useSettings().board.snapshot.format.get();
    const { $i18n } = useNuxtApp();
    const link = document.createElement('a');
    link.href = elements.board.toDataURL(format, 1);
    // translator: Snapshot save name
    const name = $i18n.t('pxls canvas');
    link.download = new Date()
      .toISOString()
      .replace(/^(\d+-\d+-\d+)T(\d+):(\d+):(\d).*$/, `${name} $1 $2.$3.$4.${format.split('/')[1]}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function validateCoordinates(x: number, y: number) {
    return x >= 0 && x <= width.value && y >= 0 && y <= height.value;
  }

  function setAllowDrag(value: boolean) {
    allowDrag.value = value === true;
  }

  /** Once the keyboard was used, locked canvases still follow view updates. */
  function markKeyboardInteraction() {
    pannedWithKeys = true;
  }

  return {
    width,
    height,
    scale,
    pan,
    loaded,
    allowDrag,
    webInfo,
    snipMode,
    viewVersion,
    pixelated,
    moverStyle,
    zoomerStyle,
    useJsRender,
    attach,
    detach,
    elements: () => elements,
    getScale,
    setScale,
    nudgeScale,
    setPaletteColors,
    draw,
    setPixelIndex,
    getPixelIndex,
    refresh,
    centerOn,
    updateViewport,
    update,
    fromScreen,
    toScreen,
    panBy,
    panByKeys,
    zoomAt,
    save,
    validateCoordinates,
    setAllowDrag,
    markKeyboardInteraction,
  };
});

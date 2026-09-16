<script setup lang="ts">
const board = useBoardStore();
const place = usePlaceStore();
const template = useTemplateStore();
const overlays = useOverlaysStore();
const lookup = useLookupStore();
const coords = useCoordsStore();
const settings = useSettings();

const container = ref<HTMLElement | null>(null);
const zoomer = ref<HTMLElement | null>(null);
const mover = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const renderCanvas = ref<HTMLCanvasElement | null>(null);
const templateHost = ref<HTMLElement | null>(null);

const templateBeneath = computed(() => settings.board.template.beneathoverlays.value.value);
const brightness = computed(() =>
  settings.ui.brightness.enable.value.value ? settings.ui.brightness.value.value.value : null,
);

// ---- Chrome canvas offset workaround -------------------------------------
// Chromium offsets the canvas by a pixel when the window size is odd.
const offsetFix = computed(() => browserFlags().webkitBased && settings.fix.chrome.offset.enable.value.value);
const viewport = reactive({ width: window.innerWidth, height: window.innerHeight });
const containerStyle = computed(() => {
  if (!offsetFix.value || !board.width) return {};
  const offsetWidth = (viewport.width + board.width) % 2;
  const offsetHeight = (viewport.height + board.height) % 2;
  return { width: `${viewport.width - offsetWidth}px`, height: `${viewport.height - offsetHeight}px` };
});

function onResize() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  board.update();
}

// ---- Pointer handling ------------------------------------------------------

const pointers = new Map<number, { x: number; y: number }>();
let pinchDistance = 0;
let velocity = { x: 0, y: 0 };
let lastMove = 0;
let inertiaFrame = 0;
let down: { x: number; y: number; time: number; onBoard: boolean; button: number } | null = null;
let holdTimer: ReturnType<typeof setTimeout> | null = null;

function clearHold() {
  if (holdTimer !== null) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
}

function isBoardTarget(target: EventTarget | null) {
  return target === canvas.value || target === renderCanvas.value;
}

function onPointerDown(event: PointerEvent) {
  (document.activeElement as HTMLElement | null)?.blur?.();
  cancelAnimationFrame(inertiaFrame);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  container.value?.setPointerCapture(event.pointerId);

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDistance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    clearHold();
    down = null;
    return;
  }

  down = {
    x: event.clientX,
    y: event.clientY,
    time: Date.now(),
    onBoard: isBoardTarget(event.target),
    button: event.button,
  };
  velocity = { x: 0, y: 0 };
  lastMove = performance.now();

  if (down.onBoard && event.button === 0 && holdTimer === null) {
    const { clientX, clientY } = event;
    holdTimer = setTimeout(() => {
      holdTimer = null;
      void lookup.runLookup(clientX, clientY);
    }, 500);
  }
}

function onPointerMove(event: PointerEvent) {
  if (isBoardTarget(event.target)) {
    place.updateReticule(event.clientX, event.clientY);
    coords.track(event.clientX, event.clientY);
  }

  const previous = pointers.get(event.pointerId);
  if (!previous) return;

  if (down && (Math.abs(down.x - event.clientX) > 5 || Math.abs(down.y - event.clientY) > 5)) {
    clearHold();
  }

  const current = { x: event.clientX, y: event.clientY };
  pointers.set(event.pointerId, current);

  if (template.dragging) return;

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    if (pinchDistance > 0 && board.allowDrag) {
      const midX = (a!.x + b!.x) / 2;
      const midY = (a!.y + b!.y) / 2;
      board.zoomAt(midX, midY, () => board.setScale(board.scale * (distance / pinchDistance), false));
    }
    pinchDistance = distance;
    board.panBy((current.x - previous.x) / 2, (current.y - previous.y) / 2);
    return;
  }

  // Only drag with the primary button (or touch/pen).
  if (event.pointerType === 'mouse' && (event.buttons & 1) === 0) return;
  const dx = current.x - previous.x;
  const dy = current.y - previous.y;
  const now = performance.now();
  const elapsed = Math.max(1, now - lastMove);
  velocity = { x: dx / elapsed, y: dy / elapsed };
  lastMove = now;
  board.panBy(dx, dy);
}

function startInertia() {
  let { x, y } = velocity;
  let last = performance.now();
  if (Math.hypot(x, y) < 0.3) return;
  const step = (now: number) => {
    const elapsed = now - last;
    last = now;
    board.panBy(x * elapsed, y * elapsed);
    const decay = Math.pow(0.992, elapsed);
    x *= decay;
    y *= decay;
    if (Math.hypot(x, y) > 0.02) {
      inertiaFrame = requestAnimationFrame(step);
    }
  };
  inertiaFrame = requestAnimationFrame(step);
}

function onPointerUp(event: PointerEvent) {
  const wasPinching = pointers.size > 1;
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinchDistance = 0;
  clearHold();

  const start = down;
  down = null;
  if (!start || wasPinching || template.dragging) return;

  const dx = Math.abs(start.x - event.clientX);
  const dy = Math.abs(start.y - event.clientY);

  if (dx >= 5 || dy >= 5) {
    if (event.pointerType !== 'mouse' || start.button === 0) startInertia();
  }

  if (!start.onBoard) return;

  // Pointer capture retargets `click`, so shift+click lookups are handled here.
  if (event.shiftKey) {
    if (start.button === 0 && dx < 5 && dy < 5) {
      void lookup.runLookup(event.clientX, event.clientY);
    }
    return;
  }

  const quick = Date.now() - start.time < 500;
  if (start.button === 0 && quick) {
    if (!board.allowDrag && dx < 25 && dy < 25) {
      const position = board.fromScreen(start.x, start.y);
      place.place(position.x, position.y);
    } else if (dx < 5 && dy < 5) {
      const position = board.fromScreen(event.clientX, event.clientY);
      place.place(position.x, position.y);
    }
  }

  if (start.button === 1 && settings.place.picker.enable.get() && dx < 15 && dy < 15) {
    const position = board.fromScreen(event.clientX, event.clientY);
    place.switchColor(board.getPixelIndex(position.x, position.y));
  }
}

function onPointerCancel(event: PointerEvent) {
  pointers.delete(event.pointerId);
  pinchDistance = 0;
  down = null;
  clearHold();
}

function onWheel(event: WheelEvent) {
  if (!board.allowDrag) return;
  let delta = -event.deltaY;
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_PIXEL:
      // Chrome reports 53px per notch.
      delta /= 53;
      break;
    case WheelEvent.DOM_DELTA_LINE:
      // Firefox reports three lines per notch.
      delta /= 3;
      break;
    case WheelEvent.DOM_DELTA_PAGE:
      delta = Math.sign(delta);
      break;
  }
  board.zoomAt(event.clientX, event.clientY, () => board.nudgeScale(delta));
}

function onContextMenu(event: MouseEvent) {
  event.preventDefault();
  const action = settings.place.rightclick.action.get();
  if (!isBoardTarget(event.target)) {
    if (action === 'clear' || action === 'clearlookup') place.switchColor(-1);
    return;
  }
  switch (action) {
    case 'clear':
      place.switchColor(-1);
      break;
    case 'copy': {
      const position = board.fromScreen(event.clientX, event.clientY);
      place.switchColor(board.getPixelIndex(position.x, position.y));
      break;
    }
    case 'lookup':
      void lookup.runLookup(event.clientX, event.clientY);
      break;
    case 'clearlookup':
      place.switchColor(-1);
      void lookup.runLookup(event.clientX, event.clientY);
      break;
  }
}

// ---- Template dragging -----------------------------------------------------

function onDocumentPointerMove(event: PointerEvent) {
  template.moveDrag(event);
}

function onDocumentPointerUp(event: PointerEvent) {
  template.endDrag(event);
}

// ---- Lifecycle ---------------------------------------------------------------

onMounted(() => {
  board.attach({
    container: container.value!,
    zoomer: zoomer.value!,
    mover: mover.value!,
    board: canvas.value!,
    render: board.useJsRender ? renderCanvas.value : null,
  });
  templateHost.value?.append(template.sourceImage, template.canvas);
  window.addEventListener('resize', onResize);
  document.addEventListener('pointermove', onDocumentPointerMove);
  document.addEventListener('pointerup', onDocumentPointerUp);
});

onBeforeUnmount(() => {
  board.detach();
  window.removeEventListener('resize', onResize);
  document.removeEventListener('pointermove', onDocumentPointerMove);
  document.removeEventListener('pointerup', onDocumentPointerUp);
});

// Keep overlay/template pixelation in sync with the zoom level.
watch(
  () => board.viewVersion,
  () => {
    const scale = board.getScale();
    overlays.setAllPixelated(scale >= 1);
    template.setPixelated(scale >= template.getWidthRatio());
  },
);

const templateStyle = computed(() => ({
  left: `${template.options.x}px`,
  top: `${template.options.y}px`,
  width: `${template.layout.width}px`,
  opacity: settings.board.template.opacity.value.value,
  pointerEvents: template.dragEnabled ? 'auto' : 'none',
}));

// Style the template elements directly: they're created by the store.
watchEffect(() => {
  const style = templateStyle.value;
  for (const element of [template.sourceImage, template.canvas]) {
    Object.assign(element.style, style);
  }
  const usesStyle = !!template.options.style;
  template.canvas.style.display = template.options.use && usesStyle ? '' : 'none';
  template.sourceImage.style.display = template.options.use && !usesStyle ? '' : 'none';
});

watchEffect(() => {
  for (const element of [template.sourceImage, template.canvas]) {
    element.className = classNames(
      'pointer-events-none absolute top-0 left-0 m-0 select-none',
      template.pixelated && 'pixelated',
      !templateBeneath.value && 'z-3',
    );
  }
});

function onTemplatePointerDown(event: PointerEvent) {
  template.startDrag(event);
}
</script>

<template>
  <div
    id="board-container"
    ref="container"
    class="fixed top-0 left-0 z-0 flex h-screen w-screen touch-none items-center justify-center select-none"
    :class="{ 'lower-template': templateBeneath }"
    :style="[containerStyle, brightness != null ? { filter: `brightness(${brightness})` } : {}]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @wheel.passive="onWheel"
    @contextmenu="onContextMenu"
  >
    <BoardGrid />
    <div id="board-zoomer" ref="zoomer" class="flex-[0_0_100px]" :style="board.zoomerStyle">
      <div id="board-mover" ref="mover" class="relative" :style="board.moverStyle">
        <!-- Tricks Chrome into rendering filters on the canvas correctly. -->
        <div
          v-if="brightness != null"
          class="pointer-events-none absolute inset-0 bg-[linear-gradient(#00000001,#00000000_0%)]"
        />
        <div ref="templateHost" class="contents" @pointerdown="onTemplatePointerDown" />
        <BoardOverlay v-for="overlay in overlays.overlays.values()" :key="overlay.name" :overlay="overlay" />
        <canvas
          id="board"
          ref="canvas"
          class="block"
          :class="{ pixelated: board.pixelated, hidden: board.useJsRender }"
          :width="board.width || 100"
          :height="board.height || 100"
        />
      </div>
    </div>
    <canvas v-if="board.useJsRender" ref="renderCanvas" class="absolute inset-0 mt-[3px] h-screen w-screen" />
  </div>
</template>

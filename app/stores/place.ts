import type { PaletteColor } from '~/types/pxls';

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      reset(): void;
      execute(): void;
      render(container: HTMLElement, params: Record<string, unknown>): number;
    };
    recaptchaCallback?: (token: string) => void;
  }
}

export const TRANSPARENT_COLOR = 0xff;

/** Placing pixels, the palette, the cursor/reticule and undo. */
export const usePlaceStore = defineStore('place', () => {
  const socket = useSocket();
  const settings = useSettings();

  const palette = shallowRef<PaletteColor[]>([]);
  const color = ref(-1);
  const reticule = reactive({ x: 0, y: 0 });
  const cursor = reactive({ x: 0, y: 0 });
  const canUndo = ref(false);
  const lastPixel = ref<{ x: number; y: number; color: number } | null>(null);
  const isDoingCaptcha = ref(false);
  const captchaLoading = ref(false);
  const specialColorsVisible = ref(false);
  const autoreset = ref(true);

  const audio = new Audio('/place.wav');
  let undoTimeout: ReturnType<typeof setTimeout> | null = null;
  let captchaScript: Promise<void> | null = null;

  const hasColor = computed(() => color.value !== -1);

  const selectedColorCss = computed(() => {
    if (color.value === TRANSPARENT_COLOR) return 'transparent';
    const entry = palette.value[color.value];
    return entry ? `#${entry.value}` : null;
  });

  function switchColor(index: number) {
    const user = useUserStore();
    const isOnPalette = index >= 0 && index < palette.value.length;
    const isTransparent = index === TRANSPARENT_COLOR && user.placementOverrides?.canPlaceAnyColor === true;
    if (!isOnPalette && !isTransparent) {
      index = -1;
    }
    color.value = index;
    ls.set('color', index);
  }

  function place(x: number, y: number, placeColor: number | null = null) {
    if (!useTimerStore().cooledDown() || color.value === -1) {
      return;
    }
    doPlace(x, y, placeColor);
  }

  function doPlace(x: number, y: number, placeColor: number | null = null) {
    const finalColor = placeColor ?? color.value;
    lastPixel.value = { x, y, color: finalColor };
    socket.send({ type: 'pixel', x, y, color: finalColor });
    analytics('send', 'event', 'Pixels', 'Place');
    if (autoreset.value) {
      switchColor(-1);
    }
  }

  function updateReticule(clientX: number, clientY: number) {
    const position = useBoardStore().fromScreen(clientX, clientY);
    reticule.x = position.x;
    reticule.y = position.y;
  }

  function undo() {
    socket.send({ type: 'undo' });
    setCanUndo(false);
  }

  function setCanUndo(value: boolean, seconds = 0) {
    canUndo.value = value;
    if (undoTimeout !== null) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }
    if (value) {
      undoTimeout = setTimeout(() => {
        canUndo.value = false;
        undoTimeout = null;
      }, seconds * 1000);
    }
  }

  function setPalette(colors: PaletteColor[]) {
    palette.value = colors;
  }

  function getPaletteABGR(): Uint32Array {
    const result = new Uint32Array(palette.value.length);
    palette.value.forEach((entry, i) => {
      const rgb = hexToRGB(entry.value);
      if (rgb) {
        result[i] = (0xff000000 | (rgb.b << 16) | (rgb.g << 8) | rgb.r) >>> 0;
      }
    });
    return result;
  }

  const paletteMaxDigits = computed(() => Math.floor(Math.log10(Math.max(1, palette.value.length))) + 1);

  function getPaletteColorValue(index: number, fallback = '000000') {
    return palette.value[index]?.value ?? fallback;
  }

  function cycleColor(direction: 1 | -1) {
    const length = palette.value.length;
    if (direction < 0) {
      switchColor(color.value < 1 ? length - 1 : color.value - 1);
    } else {
      switchColor(color.value + 1 >= length ? 0 : color.value + 1);
    }
  }

  function scrollColor(deltaY: number) {
    if (settings.place.palette.scrolling.enable.get() !== true || !deltaY) return;
    const invert = settings.place.palette.scrolling.invert.get() === true ? -1 : 1;
    const next = (color.value + (deltaY < 0 ? 1 : -1) * invert) % palette.value.length;
    switchColor(next <= -1 ? palette.value.length - 1 : next);
  }

  function loadCaptchaScript(): Promise<void> {
    captchaScript ??= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.onload = () => window.grecaptcha!.ready(resolve);
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return captchaScript;
  }

  function init() {
    const ui = useUiStore();
    const modal = useModalStore();
    const { $i18n } = useNuxtApp();

    socket.on('pixel', (data) => {
      const board = useBoardStore();
      for (const pixel of data.pixels) {
        board.setPixelIndex(pixel.x, pixel.y, pixel.color, false);
        pxlsEvents.emit('pixel', pixel);
      }
      board.refresh();
      board.update(true);
    });

    socket.on('ACK', (data) => {
      switch (data.ackFor) {
        case 'PLACE':
          pxlsEvents.emit('ack:place', { x: data.x, y: data.y });
          if (ui.tabHasFocus() && settings.audio.enable.get()) {
            const clone = audio.cloneNode(false) as HTMLAudioElement;
            clone.volume = settings.audio.alert.volume.get();
            void clone.play().catch(() => {});
          }
          break;
        case 'UNDO':
          pxlsEvents.emit('ack:undo', { x: data.x, y: data.y });
          break;
      }

      if (ui.pixelsAvailable === 0) {
        if (data.ackFor === 'PLACE') {
          ui.updateAvailable(0, 'consume');
        } else {
          ui.updateAvailable(1, 'undo');
        }
      }
    });

    socket.on('admin_placement_overrides', (data) => {
      specialColorsVisible.value = data.placementOverrides.canPlaceAnyColor;
      if (!data.placementOverrides.canPlaceAnyColor && color.value === TRANSPARENT_COLOR) {
        switchColor(-1);
      }
    });

    socket.on('captcha_required', async () => {
      const captchaKey = useBoardStore().webInfo?.captchaKey;
      if (!isDoingCaptcha.value) {
        isDoingCaptcha.value = true;
        captchaLoading.value = true;
        await loadCaptchaScript();
        ensureCaptchaWidget(captchaKey);
        window.grecaptcha!.reset();
      }
      await loadCaptchaScript();
      ensureCaptchaWidget(captchaKey);
      // Always execute, in case the user closed a previous captcha popup.
      window.grecaptcha!.execute();
      isDoingCaptcha.value = true;
      analytics('send', 'event', 'Captcha', 'Execute');
    });

    socket.on('captcha_status', (data) => {
      if (data.success) {
        if (lastPixel.value) {
          doPlace(lastPixel.value.x, lastPixel.value.y, lastPixel.value.color);
        }
        analytics('send', 'event', 'Captcha', 'Accepted');
      } else {
        modal.showText($i18n.t('Failed captcha verification'));
        analytics('send', 'event', 'Captcha', 'Failed');
      }
      captchaLoading.value = false;
    });

    socket.on('can_undo', (data) => setCanUndo(true, data.time));

    window.recaptchaCallback = (token: string) => {
      isDoingCaptcha.value = false;
      socket.send({ type: 'captcha', token });
      analytics('send', 'event', 'Captcha', 'Sent');
    };

    settings.place.deselectonplace.enable.listen((value) => {
      autoreset.value = value;
    });
  }

  let captchaWidgetRendered = false;
  function ensureCaptchaWidget(siteKey: string | undefined) {
    if (captchaWidgetRendered || !siteKey) return;
    const container = document.getElementById('g-recaptcha');
    if (!container) return;
    window.grecaptcha!.render(container, {
      sitekey: siteKey,
      size: 'invisible',
      callback: (token: string) => window.recaptchaCallback?.(token),
    });
    captchaWidgetRendered = true;
  }

  return {
    palette,
    color,
    hasColor,
    selectedColorCss,
    reticule,
    cursor,
    canUndo,
    lastPixel,
    captchaLoading,
    specialColorsVisible,
    paletteMaxDigits,
    init,
    switchColor,
    place,
    undo,
    updateReticule,
    setPalette,
    getPaletteABGR,
    getPaletteColorValue,
    cycleColor,
    scrollColor,
    setAutoReset: (value: boolean) => {
      autoreset.value = !!value;
    },
  };
});

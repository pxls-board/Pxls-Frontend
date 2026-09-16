import type { WebInfo } from '~/types/pxls';

/** Starts every subsystem, then loads /info and the board. Call once, after Board.vue mounts. */
export async function bootstrapPxls(instaban: boolean) {
  const settings = useSettings();
  const query = useQueryStore();
  const board = useBoardStore();
  const place = usePlaceStore();
  const template = useTemplateStore();
  const overlays = useOverlaysStore();
  const lookup = useLookupStore();
  const user = useUserStore();
  const ui = useUiStore();
  const chat = useChatStore();
  const socket = useSocket();

  query.init();
  template.init();
  useBanStore().init();
  place.init();
  useTimerStore().init();
  useServiceWorker().init();
  ui.init();
  user.init(instaban);
  void useNotificationsStore().init();
  chat.init();

  // Browsers only allow permission prompts from user gestures, so ask on the
  // first interaction (or when the setting is switched on).
  const requestNotifications = () => {
    if (
      settings.place.notification.enable.get() &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      void Notification.requestPermission().catch(() => console.warn('Notifications not available'));
    }
  };
  window.addEventListener('pointerdown', requestNotifications, { once: true });
  settings.place.notification.enable.listen((enabled) => {
    if (enabled && navigator.userActivation?.isActive) requestNotifications();
  });

  pxlsEvents.on('queryUpdated', ({ propName, newValue }) => {
    const nullish = newValue == null;
    const int = (value: string | null) => Number(value) >> 0;
    switch (propName.toLowerCase()) {
      case 'x':
      case 'y':
        board.centerOn(int(query.get('x') ?? null), int(query.get('y') ?? null));
        break;
      case 'scale':
        board.setScale(int(newValue), true);
        break;
      case 'template':
        template.queueUpdate({ template: newValue, use: newValue !== null });
        break;
      case 'ox':
        template.queueUpdate({ ox: nullish ? null : int(newValue) });
        break;
      case 'oy':
        template.queueUpdate({ oy: nullish ? null : int(newValue) });
        break;
      case 'tw':
        template.queueUpdate({ tw: nullish ? null : int(newValue) });
        break;
      case 'title':
        template.queueUpdate({ title: nullish ? '' : newValue });
        break;
      case 'convert':
        template.queueUpdate({ convert: newValue });
        break;
    }
  });

  // Embedding pages can drive the template and viewport via postMessage.
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; data?: Record<string, unknown> } | null;
    if (!data?.type || !data.data) return;
    switch (data.type.toUpperCase().trim()) {
      case 'TEMPLATE_UPDATE':
        template.queueUpdate(data.data);
        break;
      case 'VIEWPORT_UPDATE':
        board.updateViewport(data.data);
        break;
      default:
        console.warn('Unknown data type: %o', data.type);
    }
  });

  let info: WebInfo;
  try {
    const response = await fetch('/info');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    info = (await response.json()) as WebInfo;
  } catch (error) {
    console.error('Error fetching /info:', error);
    socket.reconnect();
    return;
  }

  board.webInfo = markRaw(info);
  board.width = info.width;
  board.height = info.height;
  lookup.webinit();
  overlays.webinit(info.width, info.height, info.heatmapCooldown);
  user.webinit(info);
  place.setPalette(info.palette);
  board.setPaletteColors(place.getPaletteABGR());
  template.webinit(info.palette, info.corsBase, info.corsParam);
  ui.setMax(info.maxStacked);
  void chat.webinit(info);
  ui.initSpecialChatColors(info.chatGradients ?? []);

  await nextTick();
  const cx = query.get('x') ?? info.width / 2;
  const cy = query.get('y') ?? info.height / 2;
  board.setScale(query.get('scale') ?? board.scale, false);
  board.centerOn(Number(cx), Number(cy), true);
  socket.init();
  user.wsinit();

  const url = query.get('template');
  if (url) {
    template.queueUpdate({
      use: true,
      x: parseFloat(query.get('ox') ?? ''),
      y: parseFloat(query.get('oy') ?? ''),
      width: parseFloat(query.get('tw') ?? ''),
      title: query.get('title'),
      url,
      convertMode: query.get('convert'),
    });
  }

  const spin = parseFloat(query.get('spin') ?? '');
  if (spin) {
    startSpin(spin);
  }

  const color = ls.get<number>('color');
  if (color != null) {
    place.switchColor(Number(color));
  }

  settings.board.zoom.rounding.enable.listen(() => {
    // Re-round the current scale if needed.
    board.setScale(board.getScale());
  });

  try {
    board.draw(await binaryAjax('/boarddata'));
  } catch (error) {
    console.error('Error drawing board:', error);
    socket.reconnect();
  }
}

/** `#spin=<seconds per turn>`: SPIN SPIN SPIN!!!! */
function startSpin(secondsPerTurn: number) {
  const container = useBoardStore().elements()?.container;
  if (!container) return;
  const degreesPerMs = 360 / (secondsPerTurn * 1000);
  let degree = 0;
  let last: number | null = null;
  const frame = (timestamp: number) => {
    last ??= timestamp;
    degree = (degree + degreesPerMs * (timestamp - last)) % 360;
    last = timestamp;
    container.style.transform = `rotate(${degree}deg)`;
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
}

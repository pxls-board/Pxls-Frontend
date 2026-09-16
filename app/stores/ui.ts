import type { ChatGradient } from '~/types/pxls';
import { useServiceWorker } from '~/composables/useServiceWorker';

export interface PxlsTheme {
  /** Value of `data-pxls-theme`; also the Tailwind variant name. */
  id: string;
  /** English name, translated in the UI. */
  name: string;
  /** `<meta name="theme-color">` */
  color: string;
  colorMode: 'light' | 'dark';
}

// Index order matches the old client, whose setting stored the index.
export const THEMES: PxlsTheme[] = [
  // translator: theme name
  { id: 'dark', name: 'Dark', color: '#1A1A1A', colorMode: 'dark' },
  // translator: theme name
  { id: 'darker', name: 'Darker', color: '#000', colorMode: 'dark' },
  // translator: theme name
  { id: 'blue', name: 'Blue', color: '#0000FF', colorMode: 'dark' },
  // translator: theme name
  { id: 'purple', name: 'Purple', color: '#5a2f71', colorMode: 'dark' },
  // translator: theme name
  { id: 'green', name: 'Green', color: '#005f00', colorMode: 'dark' },
  // translator: theme name
  { id: 'matte', name: 'Matte', color: '#468079', colorMode: 'dark' },
  // translator: theme name
  { id: 'terminal', name: 'Terminal', color: '#94e044', colorMode: 'dark' },
  // translator: theme name
  { id: 'red', name: 'Red', color: '#cf0000', colorMode: 'dark' },
  // translator: theme name
  { id: 'synthwave', name: 'Synthwave', color: '#1d192c', colorMode: 'dark' },
  // translator: theme name
  { id: 'pink', name: 'Pink', color: '#f5cdde', colorMode: 'light' },
  { id: 'blurple', name: 'Blurple (Discord)', color: '#5865F2', colorMode: 'dark' },
];

export type BubbleAnimation = 'plusone' | 'shake' | 'bump' | 'pulse';

export const useUiStore = defineStore('ui', () => {
  const socket = useSocket();
  const settings = useSettings();
  const serviceWorker = useServiceWorker();

  const pixelsAvailable = ref(-1);
  const maxStacked = ref(-1);
  const initialTitle = ref(document.title);
  const loadingStates = reactive<Record<string, boolean>>({});
  const bubbleAnimations = ref<Set<BubbleAnimation>>(new Set());
  const specialChatColors = shallowRef<ChatGradient[]>([]);
  const dragDropVisible = ref(false);
  const discordName = ref('');
  const tabId = ref<string | number | null>(null);
  const workerTabFocused = ref(false);

  const loadingBubbleVisible = computed(() => Object.values(loadingStates).some(Boolean));
  const stackText = computed(() => `${pixelsAvailable.value}/${maxStacked.value}`);
  const currentTheme = computed(() => THEMES[parseInt(settings.ui.theme.index.value.value)] ?? null);

  function tabHasFocus(): boolean {
    return serviceWorker.hasSupport ? workerTabFocused.value : ls.get('tabs.has-focus') === tabId.value;
  }

  function getTitle(prepend?: string): string {
    if (typeof prepend !== 'string') {
      if (pixelsAvailable.value > 0) {
        prepend = `[${pixelsAvailable.value}/${maxStacked.value}]`;
      } else if (pixelsAvailable.value === 0) {
        prepend = `[${useTimerStore().currentTimer}]`;
      } else {
        prepend = '';
      }
    }
    const template = useTemplateStore();
    let append = initialTitle.value;
    if (template.options.use && template.options.title) {
      append = template.options.title;
    }
    let decoded = append;
    try {
      decoded = decodeURIComponent(append);
    } catch {
      // keep as-is
    }
    return `${prepend ? `${prepend} ` : ''}${decoded}`;
  }

  function refreshTitle() {
    document.title = getTitle();
  }

  function animateMainBubble(animations: string[]) {
    for (const animation of animations) {
      if (!animation) continue;
      const name = animation as BubbleAnimation;
      if (bubbleAnimations.value.has(name)) continue;
      bubbleAnimations.value = new Set([...bubbleAnimations.value, name]);
      // Matches the animation duration in main.css.
      setTimeout(() => {
        const next = new Set(bubbleAnimations.value);
        next.delete(name);
        bubbleAnimations.value = next;
      }, 1000);
    }
  }

  function updateAvailable(count: number, cause: string) {
    pixelsAvailable.value = count;
    refreshTitle();
    if (cause === 'gain' || cause === 'stackGain') {
      animateMainBubble(settings.ui.bubble.animation.get().split(' '));
    }
    if (count > 0 && cause === 'stackGain') {
      useTimerStore().playAudio();
    }
  }

  function setMax(value: number) {
    maxStacked.value = value + 1;
  }

  function setLoadingBubbleState(process: string, state: boolean) {
    loadingStates[process] = state;
  }

  function initSpecialChatColors(colors: ChatGradient[]) {
    specialChatColors.value = colors;
    const css = colors
      .map(
        (color, i) =>
          `.gradient.${getSpecialChatColorClass(-i - 1)}{background-image:linear-gradient(${color.gradient})}`,
      )
      .join('');
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getSpecialChatColorClass(index: number) {
    const gradient = specialChatColors.value[-index - 1];
    return gradient ? `gradient--${gradient.name.toLocaleLowerCase()}` : '';
  }

  /** Classes and styles for a chat name with the given color index. */
  function chatNameColorStyle(colorIndex: number, layer: 'bg' | 'color' = 'color') {
    if (colorIndex >= 0) {
      const hex = `#${usePlaceStore().getPaletteColorValue(colorIndex)}`;
      return {
        class: '',
        style: layer === 'color' ? { color: hex } : { backgroundColor: hex },
      };
    }
    return { class: `gradient ${getSpecialChatColorClass(colorIndex)}`, style: {} };
  }

  /** Applies a chat name color to a plain DOM element (legacy API). */
  function styleElemWithChatNameColor(element: HTMLElement, colorIndex: number, layer: 'bg' | 'color' = 'bg') {
    element.className = element.classList.contains('user') ? 'user' : '';
    element.style.backgroundColor = '';
    element.style.color = '';
    const { class: cls, style } = chatNameColorStyle(colorIndex, layer);
    if (cls) element.classList.add(...cls.split(' '));
    Object.assign(element.style, style);
  }

  function handleFileUrl(url: string) {
    useTemplateStore().update({ use: true, url, convertMode: 'nearestCustom' });
  }

  function handleFile(input: { files: FileList | null } | HTMLInputElement | DataTransfer) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleFileUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function setDiscordName(name: string | null) {
    const modal = useModalStore();
    const { $i18n } = useNuxtApp();
    const value = (name ?? '').trim();
    discordName.value = value;

    // TODO: server-side validation of real Discord usernames (^[a-z0-9_.]{2,32}$)
    // and display names (^.{1,32}$). Both are allowed for now.
    if (value.length > 32) {
      modal.showText($i18n.t('Discord name is not valid.'));
      return;
    }

    try {
      await postForm('/setDiscordName', { discordName: value });
      modal.showText(
        value.length > 0 ? $i18n.t('Discord name updated successfully') : $i18n.t('Discord name reset successfully'),
      );
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      const details = await readErrorDetails(error.response);
      const heading = /<h1>(.*)<\/h1>/.exec(details)?.[1];
      const paragraph = /<p>(.*)<\/p>/.exec(details)?.[1];
      const reason = heading && paragraph ? `${heading}: ${paragraph}` : details;
      modal.showText($i18n.t("Couldn't change discord name: ").trim() + ' ' + reason, {
        title: `${$i18n.t('Error')} ${error.response.status}`,
      });
    }
  }

  function initMultiTabDetection() {
    let handleUnload: () => void;

    if (serviceWorker.hasSupport) {
      serviceWorker.addMessageListener('request-id', ({ source, data }) => {
        tabId.value = data.id as string;
        if (document.hasFocus()) {
          (source as ServiceWorker | null)?.postMessage({ type: 'focus' });
        }
      });
      serviceWorker.addMessageListener('focus', ({ data }) => {
        workerTabFocused.value = tabId.value === data.id;
      });
      serviceWorker.ready
        .then(() => serviceWorker.postMessage({ type: 'request-id' }))
        .catch(() => {
          workerTabFocused.value = true;
        });
      window.addEventListener('focus', () => serviceWorker.postMessage({ type: 'focus' }));
      handleUnload = () => serviceWorker.postMessage({ type: 'leave' });
    } else {
      const openTabs = ls.get<number[]>('tabs.open') ?? [];
      let id: number;
      do {
        id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      } while (openTabs.includes(id));
      tabId.value = id;
      openTabs.push(id);
      ls.set('tabs.open', openTabs);

      const markFocused = () => ls.set('tabs.has-focus', id);
      if (document.hasFocus()) markFocused();
      window.addEventListener('focus', markFocused);

      handleUnload = () => {
        const tabs = ls.get<number[]>('tabs.open') ?? [];
        tabs.splice(tabs.indexOf(id), 1);
        ls.set('tabs.open', tabs);
      };
    }

    let handled = false;
    const onUnload = () => {
      if (handled) return;
      handled = true;
      handleUnload();
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
  }

  function init() {
    const modal = useModalStore();
    const { $i18n } = useNuxtApp();
    initialTitle.value = document.title;
    initMultiTabDetection();

    socket.on('pixels', (data) => {
      updateAvailable(data.count, data.cause);
      pxlsEvents.emit('pixels', data);
    });

    socket.on('alert', (data) => {
      modal.showComponent(
        defineAsyncComponent(() => import('~/components/modals/AlertModal.vue')),
        { message: data.message, sender: data.sender },
        { title: $i18n.t('Alert'), closeExisting: false, clickClose: false },
      );
    });

    socket.on('received_report', (data) => {
      const type = data.report_type.toLowerCase();
      useToast().add({
        title: $i18n.t('A new ${type} report has been received.', { type }),
        icon: ICONS.info,
      });
    });

    settings.board.lock.enable.listen((value) => useBoardStore().setAllowDrag(!value));

    settings.ui.bubble.animation.listen((value) => {
      // Don't animate during page load.
      if (pixelsAvailable.value === -1) return;
      animateMainBubble(value.split(' '));
    });
  }

  return {
    pixelsAvailable,
    maxStacked,
    initialTitle,
    loadingStates,
    loadingBubbleVisible,
    bubbleAnimations,
    specialChatColors,
    dragDropVisible,
    discordName,
    tabId,
    stackText,
    currentTheme,
    init,
    tabHasFocus,
    getTitle,
    refreshTitle,
    animateMainBubble,
    updateAvailable,
    getAvailable: () => pixelsAvailable.value,
    setMax,
    setLoadingBubbleState,
    initSpecialChatColors,
    getSpecialChatColorClass,
    getSpecialChatColors: () => specialChatColors.value,
    chatNameColorStyle,
    styleElemWithChatNameColor,
    handleFile,
    handleFileUrl,
    setDiscordName,
  };
});

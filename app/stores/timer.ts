/** The placement cooldown countdown and the "pixel available" alerts. */
export const useTimerStore = defineStore('timer', () => {
  const socket = useSocket();
  const settings = useSettings();

  const cooldown = ref(0);
  const currentTimer = ref('');
  const audio = new Audio('/notify.wav');
  let hasFiredNotification = true;
  let tick: ReturnType<typeof setTimeout> | null = null;

  const cooledDown = () => cooldown.value < Date.now();
  const counting = computed(() => currentTimer.value !== '' && currentTimer.value !== '00:00');

  function playAudio() {
    if (useUiStore().tabHasFocus() && settings.audio.enable.get()) {
      void audio.play().catch(() => {});
    }
  }

  function fireNotification(text: string, params?: Record<string, unknown>) {
    playAudio();
    if (!document.hasFocus()) {
      const { $i18n } = useNuxtApp();
      const notification = showNativeNotification(params ? $i18n.t(text, params) : $i18n.t(text));
      if (notification) {
        const close = () => {
          notification.close();
          pxlsEvents.off('ack:place', close);
        };
        pxlsEvents.on('ack:place', close);
      }
    }
  }

  function update() {
    if (tick !== null) {
      clearTimeout(tick);
      tick = null;
    }
    const ui = useUiStore();
    const alertDelay = settings.place.alert.delay.get();
    // One extra millisecond keeps the first displayed value from jumping.
    const delta = (cooldown.value - Date.now() - 1) / 1000;

    if (delta > 0) {
      const secs = Math.floor(Math.ceil(delta) % 60);
      const mins = Math.floor(Math.ceil(delta) / 60);
      currentTimer.value = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      currentTimer.value = '00:00';
    }
    ui.refreshTitle();

    if (delta > 0 && Math.abs(alertDelay) < delta) {
      hasFiredNotification = false;
    }

    if (!hasFiredNotification) {
      if (alertDelay < 0 && delta <= Math.abs(alertDelay)) {
        hasFiredNotification = true;
        const delay = Math.round(Math.abs(alertDelay) * 10) / 10;
        fireNotification(msg('Your next pixel will be available in ${delay} seconds!'), { delay });
        setTimeout(() => {
          if (hasFiredNotification) {
            ui.updateAvailable(1, 'gain');
          }
        }, delta * 1000);
      } else if (alertDelay > 0 && delta <= 0) {
        hasFiredNotification = true;
        ui.updateAvailable(1, 'gain');
        setTimeout(() => {
          if (ui.pixelsAvailable > 0) {
            fireNotification(msg('Your next pixel has been available for ${alertDelay} seconds!'), {
              alertDelay: Math.round(alertDelay * 10) / 10,
            });
          }
        }, alertDelay * 1000);
      } else if (delta <= 0) {
        hasFiredNotification = true;
        ui.updateAvailable(1, 'gain');
        fireNotification(msg('Your next pixel is available!'));
      }
    }

    if (!hasFiredNotification || delta > 0) {
      tick = setTimeout(update, 1000);
    }
  }

  function init() {
    setTimeout(() => {
      const ui = useUiStore();
      if (cooledDown() && ui.pixelsAvailable === 0) {
        ui.updateAvailable(1, 'gain');
      }
    }, 250);

    socket.on('cooldown', (data) => {
      cooldown.value = Date.now() + data.wait * 1000;
      hasFiredNotification = data.wait === 0;
      pxlsEvents.emit('cooldown', { wait: data.wait });
      update();
    });

    settings.audio.alert.volume.listen((volume) => {
      audio.volume = Number.isNaN(volume) ? 1 : clamp(volume, 0, 1);
    });

    let debounce: ReturnType<typeof setTimeout> | null = null;
    settings.audio.alert.src.listen((url) => {
      if (debounce !== null) clearTimeout(debounce);
      debounce = setTimeout(() => {
        setAudioSource(url);
        debounce = null;
      }, 250);
    });

    audio.addEventListener('error', (error) => {
      console.warn('An error occurred on the audioElem node: %o', error);
    });
  }

  function setAudioSource(url: string) {
    try {
      audio.src = url || '/notify.wav';
    } catch {
      const { $i18n } = useNuxtApp();
      useModalStore().showText($i18n.t('Failed to update audio src, using default sound.'));
      audio.src = '/notify.wav';
    }
  }

  return {
    cooldown,
    currentTimer,
    counting,
    audioElem: audio,
    init,
    cooledDown,
    playAudio,
    setAudioSource,
    getCurrentTimer: () => currentTimer.value,
  };
});

/** Shows a desktop notification if enabled and allowed. */
export function showNativeNotification(body: string): Notification | null {
  const settings = useSettings();
  if (
    !settings.place.notification.enable.get() ||
    !useUiStore().tabHasFocus() ||
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return null;
  }

  const ui = useUiStore();
  const template = useTemplateStore();
  let title = ui.initialTitle;
  if (template.options.use && template.options.title) {
    title = `${template.options.title} - ${title}`;
  }

  try {
    const notification = new Notification(title, { body, icon: '/favicon.ico' });
    notification.onclick = () => {
      window.parent.focus();
      window.focus();
      notification.close();
    };
    return notification;
  } catch {
    console.warn('Notifications not available');
    return null;
  }
}

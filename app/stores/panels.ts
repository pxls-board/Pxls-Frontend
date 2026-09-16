export type PanelId = 'info' | 'faq' | 'notifications' | 'settings' | 'chat';
export type PanelSide = 'left' | 'right';

const PANEL_SIDES: Record<PanelId, PanelSide> = {
  info: 'left',
  faq: 'left',
  notifications: 'left',
  settings: 'right',
  chat: 'right',
};

export const usePanelsStore = defineStore('panels', () => {
  const openState = reactive<Record<PanelId, boolean>>({
    info: false,
    faq: false,
    notifications: false,
    settings: false,
    chat: false,
  });
  const disabled = reactive<Record<PanelId, boolean>>({
    info: false,
    faq: false,
    notifications: false,
    settings: false,
    chat: false,
  });

  const isPanel = (panel: string): panel is PanelId => panel in PANEL_SIDES;

  function setOpen(panel: string, state: boolean, exclusive = true) {
    if (!isPanel(panel) || disabled[panel]) return;
    const side = PANEL_SIDES[panel];

    if (state) {
      if (exclusive) {
        for (const other of Object.keys(openState) as PanelId[]) {
          if (other !== panel && PANEL_SIDES[other] === side && openState[other]) {
            openState[other] = false;
            pxlsEvents.emit('panel:closed', other);
          }
        }
      }
      if (!openState[panel]) {
        openState[panel] = true;
        pxlsEvents.emit('panel:opened', panel);
      }
    } else if (openState[panel]) {
      openState[panel] = false;
      (document.activeElement as HTMLElement | null)?.blur?.();
      pxlsEvents.emit('panel:closed', panel);
    }
  }

  const openSide = (side: PanelSide) =>
    (Object.keys(openState) as PanelId[]).find((panel) => openState[panel] && PANEL_SIDES[panel] === side) ?? null;

  const leftPanel = computed(() => openSide('left'));
  const rightPanel = computed(() => openSide('right'));

  function closeAll() {
    for (const panel of Object.keys(openState) as PanelId[]) {
      setOpen(panel, false);
    }
  }

  return {
    openState,
    disabled,
    leftPanel,
    rightPanel,
    anyOpen: computed(() => leftPanel.value !== null || rightPanel.value !== null),
    isOpen: (panel: string) => isPanel(panel) && !disabled[panel] && openState[panel],
    isEnabled: (panel: string) => isPanel(panel) && !disabled[panel],
    setEnabled(panel: string, enabled: boolean) {
      if (!isPanel(panel)) return;
      disabled[panel] = !enabled;
      if (!enabled) openState[panel] = false;
    },
    open: (panel: string) => setOpen(panel, true),
    close: (panel: string) => setOpen(panel, false),
    toggle: (panel: string, exclusive = true) => {
      if (isPanel(panel)) setOpen(panel, !openState[panel], exclusive);
    },
    setOpen,
    closeAll,
    sideOf: (panel: PanelId) => PANEL_SIDES[panel],
  };
});

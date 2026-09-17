const NUM_KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '`']);

/** Global canvas hotkeys (see the Keybinds section of the settings panel). */
export function useKeybinds() {
  const settings = useSettings();
  const board = useBoardStore();
  const place = usePlaceStore();
  const panels = usePanelsStore();
  const template = useTemplateStore();
  const overlays = useOverlaysStore();
  const lookup = useLookupStore();
  const coords = useCoordsStore();
  const user = useUserStore();

  let numKeysPressed = '';
  let numKeysTimeout: ReturnType<typeof setTimeout> | null = null;
  // Toggle keys fire once per press, not on key repeat.
  const held = new Set<string>();

  function toggleOnce(key: string, action: () => void) {
    if (held.has(key)) return;
    held.add(key);
    action();
  }

  function handlePaletteDigit(key: string) {
    numKeysPressed += key;
    place.switchColor(Number(numKeysPressed.replace('`', '0')));
    if (numKeysTimeout) clearTimeout(numKeysTimeout);
    if (numKeysPressed.length >= place.paletteMaxDigits) {
      numKeysPressed = '';
      return;
    }
    numKeysTimeout = setTimeout(() => {
      numKeysPressed = '';
    }, 500);
  }

  function handleEscape() {
    if (lookup.visible) {
      lookup.hide();
    } else if (user.signInPromptOpen) {
      user.signInPromptOpen = false;
    } else if (panels.anyOpen) {
      panels.closeAll();
    } else {
      place.switchColor(-1);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (isTypingTarget(event)) return;
    // Let dialogs handle their own keys.
    if (useModalStore().stack.length > 0) return;

    if (NUM_KEYS.has(event.key)) {
      handlePaletteDigit(event.key);
    }

    if (template.options.use && (event.key === 'Control' || event.key === 'Alt')) {
      event.preventDefault();
      template.dragEnabled = true;
    }

    const key = event.key.toLowerCase();
    const panStep = 100;

    switch (event.code || event.key) {
      case 'KeyW':
      case 'ArrowUp':
        board.panByKeys(0, panStep);
        break;
      case 'KeyD':
      case 'ArrowRight':
        board.panByKeys(-panStep, 0);
        break;
      case 'KeyS':
      case 'ArrowDown':
        board.panByKeys(0, -panStep);
        break;
      case 'KeyA':
      case 'ArrowLeft':
        board.panByKeys(panStep, 0);
        break;
      case 'KeyP':
        board.save();
        break;
      case 'KeyL':
        settings.board.lock.enable.toggle();
        break;
      case 'KeyR':
        if (template.options.use) {
          board.centerOn(
            template.options.x + template.getDisplayWidth() / 2,
            template.options.y + template.getDisplayHeight() / 2,
          );
        } else if (place.lastPixel) {
          board.centerOn(place.lastPixel.x, place.lastPixel.y);
        }
        break;
      case 'KeyJ':
        place.cycleColor(-1);
        break;
      case 'KeyK':
        place.cycleColor(1);
        break;
      case 'KeyE':
      case 'Equal':
      case 'NumpadAdd':
        board.nudgeScale(1);
        break;
      case 'KeyQ':
      case 'Minus':
      case 'NumpadSubtract':
        board.nudgeScale(-1);
        break;
      case 'KeyT':
        panels.toggle('settings');
        break;
      case 'KeyI':
        panels.toggle('info');
        break;
      case 'KeyB':
        if (settings.chat.enable.get()) panels.toggle('chat');
        break;
      case 'KeyG':
        toggleOnce('g', () => settings.board.grid.enable.toggle());
        break;
      case 'KeyH':
        toggleOnce('h', () => settings.board.heatmap.enable.toggle());
        break;
      case 'KeyX':
        toggleOnce('x', () => settings.board.virginmap.enable.toggle());
        break;
      case 'KeyV':
        toggleOnce('v', () => template.update({ use: !template.options.use }));
        break;
      case 'KeyO':
        overlays.get('heatmap')?.clear();
        break;
      case 'KeyU':
        overlays.get('virginmap')?.clear();
        break;
      case 'KeyC':
        if (!event.ctrlKey && !event.metaKey) coords.copyCoords();
        break;
      case 'KeyZ':
        if (event.ctrlKey && place.canUndo) {
          event.stopPropagation();
          place.undo();
        }
        break;
      case 'PageUp':
        template.adjustOpacity(0.1);
        break;
      case 'PageDown':
        template.adjustOpacity(-0.1);
        break;
      case 'Escape':
        handleEscape();
        break;
      default:
        // Layouts without key codes: fall back to the character.
        if (key === '=' || key === '+') board.nudgeScale(1);
        if (key === '-') board.nudgeScale(-1);
    }

    board.markKeyboardInteraction();
    board.update();
  }

  function onKeyUp(event: KeyboardEvent) {
    const code = (event.code || event.key).replace(/^Key/, '').toLowerCase();
    held.delete(code);
    template.stopDragging();
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', template.stopDragging);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', template.stopDragging);
  });
}

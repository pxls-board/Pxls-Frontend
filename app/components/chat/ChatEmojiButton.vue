<script setup lang="ts">
declare global {
  interface Window {
    EmojiButton?: {
      EmojiButton: new (options: Record<string, unknown>) => EmojiPicker;
    };
  }
}

interface EmojiPicker {
  pickerVisible: boolean;
  pickerEl?: HTMLElement;
  on(event: 'emoji', callback: (emoji: { emoji?: string; name: string; custom?: boolean }) => void): void;
  showPicker(anchor: HTMLElement): void;
  hidePicker(): void;
}

const chat = useChatStore();
const button = ref<{ $el: HTMLElement } | null>(null);
let picker: EmojiPicker | null = null;

async function getPicker() {
  if (picker) return picker;
  await import('~/vendor/emoji-button.min.js');
  const options: Record<string, unknown> = {
    position: 'left-start',
    style: 'twemoji',
    zIndex: 60,
    emojiVersion: '13.0',
    theme: 'auto',
  };
  if (chat.customEmoji.length > 0) options.custom = chat.customEmoji;
  picker = new window.EmojiButton!.EmojiButton(options);
  picker.on('emoji', (emoji) => {
    chat.appendToInput(emoji.custom ? `:${emoji.name}:` : (emoji.emoji ?? ''));
  });
  return picker;
}

async function toggle() {
  const instance = await getPicker();
  if (instance.pickerVisible) {
    instance.hidePicker();
    return;
  }
  instance.showPicker(button.value!.$el);
  // The search box is recreated each time; keep its keys away from hotkeys.
  instance.pickerEl
    ?.querySelector('.emoji-picker__search')
    ?.addEventListener('keydown', (event) => event.stopPropagation());
}
</script>

<template>
  <UButton
    ref="button"
    :icon="ICONS.emoji"
    color="neutral"
    variant="ghost"
    :title="$t('Emoji')"
    :aria-label="$t('Emoji')"
    @click="toggle"
  />
</template>

<script setup lang="ts">
import type { ChatMessageLine } from '~/stores/chat';

const chat = useChatStore();
const panels = usePanelsStore();
const settings = useSettings();
const settingsStore = useSettingsStore();
const timer = useTimerStore();
const board = useBoardStore();
const { t } = useI18n();

const body = ref<HTMLElement | null>(null);
const inputComponent = ref<{ textareaRef?: HTMLTextAreaElement } | null>(null);
const typeaheadList = ref<HTMLElement | null>(null);

const horizontal = computed(() => settings.ui.chat.horizontal.enable.value.value);
const fontSize = computed(() => `${settings.chat.font.size.value.value || 16}px`);

// Ignored users' messages are hidden; striping only counts visible lines.
const visibleLines = computed(() => {
  let index = 0;
  return chat.lines
    .filter((line) => line.kind === 'server' || board.snipMode || !chat.ignored.includes(line.author))
    .map((line) => ({ line, odd: line.kind === 'message' ? index++ % 2 === 0 : false }));
});

const replyLine = computed(() => (chat.replyTarget !== null ? chat.messagesById.get(chat.replyTarget) : undefined));

// ---- Scrolling ---------------------------------------------------------------

function textarea() {
  return inputComponent.value?.textareaRef ?? null;
}

function updateStickToBottom() {
  const element = body.value;
  if (!element) return;
  const bottom = element.scrollHeight - element.offsetHeight;
  chat.stickToBottom = Math.abs((element.scrollTop >> 0) - bottom) <= 2;
}

function onScroll() {
  updateStickToBottom();
  if (chat.stickToBottom && panels.isOpen('chat')) {
    chat.clearPings();
  }
  popup.value = null;
}

async function scrollToBottom() {
  await nextTick();
  if (body.value) body.value.scrollTop = body.value.scrollHeight;
  chat.stickToBottom = true;
}

async function scrollTo(id: number) {
  await nextTick();
  body.value?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function focusInput() {
  nextTick(() => textarea()?.focus());
}

function closePopups() {
  popup.value = null;
}

onMounted(() => {
  chatEvents.on('scrollToBottom', scrollToBottom);
  chatEvents.on('scrollTo', scrollTo);
  chatEvents.on('focusInput', focusInput);
  chatEvents.on('closePopups', closePopups);
});

onBeforeUnmount(() => {
  chatEvents.off('scrollToBottom', scrollToBottom);
  chatEvents.off('scrollTo', scrollTo);
  chatEvents.off('focusInput', focusInput);
  chatEvents.off('closePopups', closePopups);
});

watch(
  () => panels.isOpen('chat'),
  (open) => {
    if (open && chat.stickToBottom) void scrollToBottom();
  },
);

// ---- User popup -----------------------------------------------------------------

const popup = ref<{ line: ChatMessageLine; anchor: HTMLElement } | null>(null);

function openUser(line: ChatMessageLine, anchor: HTMLElement) {
  popup.value = { line, anchor };
}

// ---- Input ----------------------------------------------------------------------------

function caret() {
  return textarea()?.selectionStart ?? chat.input.length;
}

function onKeydown(event: KeyboardEvent) {
  event.stopPropagation();

  if (chat.typeahead.suggesting) {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        chat.resetTypeahead();
        return;
      case 'Tab':
        event.preventDefault();
        chat.selectTypeahead(event.shiftKey ? -1 : 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        chat.selectTypeahead(-1);
        return;
      case 'ArrowDown':
        event.preventDefault();
        chat.selectTypeahead(1);
        return;
      case 'Enter':
        if (chat.typeahead.shouldInsert) {
          event.preventDefault();
          chat.insertTypeahead();
          return;
        }
        break;
    }
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chat.send();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    chat.scanTypeahead(caret());
  }
}

function onKeyup(event: KeyboardEvent) {
  event.stopPropagation();
  chat.checkInput();
  if (['Tab', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) return;
  // Don't rescan when only modifier keys changed.
  if (chat.input.length !== chat.typeahead.lastLength) {
    chat.scanTypeahead(caret());
  }
}

function onFocus() {
  if (chat.stickToBottom) setTimeout(scrollToBottom, 300);
}

watch(
  () => chat.typeahead.highlightedIndex,
  async (index) => {
    await nextTick();
    typeaheadList.value?.children[index]?.scrollIntoView({ block: 'nearest' });
  },
);

function renderTypeahead(entry: { key: string; value: string }) {
  const database = chat.typeahead.database;
  if (!database) return entry.value;
  return database.name === 'emoji' ? `:${entry.key}:` : database.renderer(entry);
}

function isCustomEmoji(value: string) {
  return !twemoji.test(value);
}

function emojiPreview(value: string) {
  const span = document.createElement('span');
  span.textContent = value;
  twemoji.parse(span);
  return [...span.childNodes];
}

function openChatSettings() {
  settingsStore.filter.search(t('Chat'));
  panels.toggle('settings');
}
</script>

<template>
  <PxlsPanel dom-id="chat" panel="chat" :title="$t('Chat')" :icon="ICONS.chat" :bottom="horizontal" fill>
    <template #title-extra>
      <span v-if="timer.counting" class="text-sm font-normal text-muted sm:hidden">{{ timer.currentTimer }}</span>
    </template>
    <template #header-right>
      <ChatPingsPopup />
      <UButton
        :icon="ICONS.settings"
        color="neutral"
        variant="ghost"
        :title="$t('Settings')"
        :aria-label="$t('Settings')"
        @click="openChatSettings"
      />
    </template>

    <div class="flex min-h-0 flex-1 flex-col">
      <ul
        id="chat-body"
        ref="body"
        class="chat-body min-h-0 flex-1 overflow-y-auto font-[Arial,Helvetica,sans-serif] terminal:font-mono blurple:font-sans"
        :style="{ fontSize, paddingBottom: chat.replyTarget !== null ? '1.25em' : undefined }"
        @scroll.passive="onScroll"
        @wheel.passive="popup = null"
      >
        <template v-for="{ line, odd } in visibleLines" :key="line.key">
          <li
            v-if="line.kind === 'server'"
            class="chat-line server-action border-b border-pxls-chat-separator px-1 py-1 text-center font-bold text-pxls-server-action"
          >
            <span :title="formatDate(line.date, LONG_TIMESTAMP)">
              {{ chatTimestamp(line.date, settings.chat.timestamps['24h'].value.value) }}
            </span>
            - <span class="content">{{ line.text }}</span>
          </li>
          <ChatMessage v-else :line="line" :odd="odd" @open-user="openUser" />
        </template>
      </ul>

      <div v-if="chat.hint" class="chat-hints px-2 py-1 text-sm" :class="{ 'text-error': chat.hint.error }">
        {{ chat.hint.message }}
      </div>

      <div class="chat-controls relative border-t border-default">
        <UButton
          v-if="!chat.stickToBottom"
          block
          class="absolute inset-x-0 z-10 rounded-none"
          :class="chat.replyTarget !== null ? '-top-18' : '-top-9'"
          :trailing-icon="ICONS.jumpToBottom"
          :icon="ICONS.jumpToBottom"
          @mousedown.prevent
          @click="scrollToBottom"
        >
          {{ $t('Jump To Bottom') }}
        </UButton>

        <div
          v-if="replyLine"
          id="reply-label"
          class="flex items-center gap-2 border-b border-default bg-elevated px-2 py-1 text-sm"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-1 truncate text-left"
            @mousedown.prevent
            @click="chat.scrollToMessage(replyLine.id)"
          >
            <span>{{ $t('Replying to') }}</span>
            <ChatUserDisplay
              :author="replyLine.author"
              :name-color="replyLine.nameColor"
              :badges="replyLine.badges"
              :faction="replyLine.faction"
            />
          </button>
          <UButton
            size="xs"
            :color="chat.replyMention ? 'primary' : 'neutral'"
            variant="soft"
            :icon="ICONS.mention"
            @mousedown.prevent
            @click="chat.replyMention = !chat.replyMention"
          >
            {{ chat.replyMention ? $t('On') : $t('Off') }}
          </UButton>
          <UButton :icon="ICONS.close" size="xs" color="neutral" variant="ghost" @click="chat.cancelReply()" />
        </div>

        <div
          v-if="chat.typeahead.suggesting && chat.typeahead.hasResults"
          id="typeahead"
          class="absolute inset-x-0 bottom-full z-20 max-h-64 overflow-y-auto border-t border-default bg-default shadow-lg"
        >
          <button
            type="button"
            class="block w-full py-1 text-center text-sm text-muted italic"
            @click="
              chat.resetTypeahead();
              focusInput();
            "
          >
            Tap here or press ESC to cancel
          </button>
          <ul ref="typeaheadList">
            <li v-for="(entry, index) in chat.typeahead.results" :key="entry.key">
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-1 text-left text-sm hover:bg-elevated"
                :class="{ 'bg-accented': index === chat.typeahead.highlightedIndex }"
                @mousedown.prevent
                @click="chat.insertTypeahead(index)"
              >
                <template v-if="chat.typeahead.database?.name === 'emoji'">
                  <img
                    v-if="isCustomEmoji(entry.value)"
                    class="emoji emoji--custom h-5 w-auto"
                    draggable="false"
                    :alt="entry.key"
                    :src="entry.value"
                  />
                  <DomNodes v-else :nodes="emojiPreview(entry.value)" class="pxls-markdown" />
                </template>
                <span>{{ renderTypeahead(entry) }}</span>
              </button>
            </li>
          </ul>
        </div>

        <div class="relative flex items-end gap-1 p-2">
          <UTextarea
            ref="inputComponent"
            v-model="chat.input"
            name="txtChatContent"
            :placeholder="'Press ENTER to send...'"
            :maxlength="chat.charLimit"
            :disabled="chat.inputDisabled"
            :rows="1"
            autoresize
            :maxrows="5"
            class="flex-1"
            @keydown="onKeydown"
            @keyup="onKeyup"
            @click="chat.scanTypeahead(caret())"
            @focus="onFocus"
          />
          <ChatEmojiButton v-if="chat.emojiButtonVisible" />
          <div
            v-if="chat.overlayVisible"
            class="chat-ratelimit-overlay absolute inset-0 flex items-center justify-center bg-default/90 px-2 text-center text-sm font-semibold"
          >
            <span id="chat-ratelimit">{{ chat.rateLimitText }}</span>
          </div>
        </div>

        <ChatBanner v-if="board.webInfo" id="bottom-banner" class="border-t border-default" />
      </div>
    </div>

    <ChatUserPopup :line="popup?.line ?? null" :anchor="popup?.anchor ?? null" @close="popup = null" />
  </PxlsPanel>
</template>

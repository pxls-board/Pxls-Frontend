<script setup lang="ts">
import type { ChatMessageLine } from '~/stores/chat';

const props = defineProps<{ line: ChatMessageLine; odd: boolean }>();

const emit = defineEmits<{ openUser: [line: ChatMessageLine, anchor: HTMLElement] }>();

const chat = useChatStore();
const settings = useSettings();
const { t } = useI18n();

const date = computed(() => fromUnix(props.line.date));
const timestamp = computed(() => chatTimestamp(date.value, settings.chat.timestamps['24h'].value.value));
const purgeTitle = computed(() => {
  const purge = props.line.purge;
  if (!purge) return undefined;
  const reason = purge.reason || t('none provided');
  return t('Purged by ${purge.initiator} with reason: ${reason}', { 'purge.initiator': purge.initiator, reason });
});

function reply(event: MouseEvent) {
  chat.startReply(props.line.id, event.shiftKey);
}
</script>

<template>
  <li
    class="chat-line group relative border-b border-pxls-chat-separator px-1 py-1 leading-normal"
    :class="{
      'bg-pxls-chat-odd': odd && !line.hasPing,
      'bg-pxls-ping': line.hasPing,
      'bg-pxls-reply!': chat.replyTarget === line.id,
      'animate-[pxls-flash_150ms_linear_1ms_4_alternate]': chat.highlightedId === line.id,
      'text-[0.9em]': line.purge || line.shadowBanned,
      'is-from-us': line.isFromUs,
    }"
    :data-id="line.id"
    :data-author="line.author"
    :title="purgeTitle"
  >
    <ChatReplyPreview v-if="line.reply" :reply="line.reply" class="mb-0.5" />
    <div :class="{ 'text-muted italic line-through': line.purge, 'text-[#f66]': line.shadowBanned }">
      <span :title="formatDate(date, LONG_TIMESTAMP)" class="cursor-default border-b border-dashed border-current/40">
        {{ timestamp }}
      </span>
      {{ ' ' }}
      <ChatUserDisplay
        :author="line.author"
        :name-color="line.nameColor"
        :badges="line.badges"
        :faction="line.faction"
        interactive
        @name-click="emit('openUser', line, $event.currentTarget as HTMLElement)"
        @name-middle-click="chat.appendToInput(`@${line.author} `)"
      />
      <span>: </span>
      <DomNodes :nodes="line.content" class="content pxls-markdown" />
    </div>
    <button
      type="button"
      class="absolute top-1 right-1 z-1 text-xl opacity-0 group-hover:opacity-60 hover:opacity-100"
      :title="$t('Reply')"
      @mousedown.prevent
      @click="reply"
    >
      <UIcon :name="ICONS.reply" />
    </button>
  </li>
</template>

<script setup lang="ts">
import type { ReplyInfo } from '~/stores/chat';

const props = defineProps<{ reply: ReplyInfo }>();

const chat = useChatStore();
const board = useBoardStore();

const live = computed(() => chat.messagesById.get(props.reply.id));
const source = computed(() => live.value ?? props.reply.snapshot);
const ignored = computed(() => !!source.value && !board.snipMode && chat.ignored.includes(source.value.author));
const purged = computed(() => props.reply.purged || !!live.value?.purge);

// The preview shows a copy of the message without clickable links.
const content = computed(() => {
  const nodes = source.value?.content ?? [];
  return nodes.map((node) => {
    const clone = node.cloneNode(true);
    if (clone instanceof Element) {
      clone.querySelectorAll('a').forEach((anchor) => anchor.removeAttribute('href'));
      if (clone instanceof HTMLAnchorElement) clone.removeAttribute('href');
    }
    return clone;
  });
});

const jumpable = computed(() => !!source.value && !ignored.value && !(purged.value && !live.value?.purge));
</script>

<template>
  <div
    class="reply-preview flex items-center gap-1 truncate text-[0.7rem] leading-none text-muted select-none"
    :class="{
      'cursor-pointer': jumpable,
      'text-[0.63rem] italic line-through': purged,
      'text-[#f66]': live?.shadowBanned,
    }"
    :title="source ? `${source.author}: ${source.messageRaw}` : ''"
    @mousedown.prevent
    @click="jumpable && chat.scrollToMessage(reply.id)"
  >
    <UIcon :name="ICONS.reply" class="shrink-0 -scale-x-100" />
    <template v-if="!source">{{ "Message couldn't be found" }}</template>
    <template v-else-if="ignored">Message was ignored</template>
    <template v-else-if="purged && !live?.purge">Message was purged</template>
    <template v-else>
      <ChatUserDisplay
        :author="source.author"
        :name-color="live?.nameColor ?? source.nameColor"
        :badges="source.badges"
        :faction="live ? live.faction : source.faction"
        :mention="reply.mention"
      />
      <span>:</span>
      <DomNodes :nodes="content" class="pxls-markdown truncate" />
    </template>
  </div>
</template>

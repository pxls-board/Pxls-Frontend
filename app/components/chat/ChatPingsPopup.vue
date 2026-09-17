<script setup lang="ts">
const chat = useChatStore();
const board = useBoardStore();

const open = ref(false);

// Pings render their raw text; markdown DOM nodes are already in use by the chat list.
function preview(raw: string) {
  return chat.processMessage(raw);
}

function jump(id: number) {
  open.value = false;
  chat.scrollToMessage(id);
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ side: 'left', align: 'start', collisionPadding: 8 }"
    :ui="{ content: 'z-30' }"
  >
    <UButton
      :icon="ICONS.mention"
      color="neutral"
      variant="ghost"
      :title="$t('Pings')"
      :aria-label="$t('Pings')"
      :class="{ 'text-pxls-notification': chat.pings > 0 }"
    />
    <template #content>
      <div class="w-80 max-w-[90vw]">
        <header class="border-b border-default bg-elevated px-3 py-2 font-semibold">Pings</header>
        <ul class="max-h-[73vh] divide-y divide-default overflow-y-auto text-sm">
          <li
            v-for="ping in chat.pingsList"
            :key="ping.id"
            class="flex items-start gap-2 px-3 py-1.5"
            :title="nodesToText(ping.content)"
          >
            <button type="button" class="mt-0.5 shrink-0 text-muted hover:text-default" @click="jump(ping.id)">
              <UIcon :name="ICONS.jump" class="size-3.5" />
            </button>
            <span class="min-w-0 break-words">
              <b>{{ board.snipMode ? '-snip-' : ping.author }}: </b>
              <DomNodes :nodes="preview(ping.messageRaw)" class="pxls-markdown" />
            </span>
          </li>
          <li v-if="chat.pingsList.length === 0" class="px-3 py-4 text-center text-muted italic">
            {{ $t('No Results') }}
          </li>
        </ul>
      </div>
    </template>
  </UPopover>
</template>

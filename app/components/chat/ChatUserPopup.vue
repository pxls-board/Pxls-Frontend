<script setup lang="ts">
import type { ChatAction, ChatMessageLine } from '~/stores/chat';

const props = defineProps<{ line: ChatMessageLine | null; anchor: HTMLElement | null }>();
const emit = defineEmits<{ close: [] }>();

const chat = useChatStore();
const user = useUserStore();
const board = useBoardStore();
const settings = useSettings();
const { t } = useI18n();

const open = computed({
  get: () => props.line !== null && props.anchor !== null,
  set: (value: boolean) => {
    if (!value) emit('close');
  },
});

interface ActionEntry {
  label: string;
  action: ChatAction;
  danger?: boolean;
  staff?: boolean;
}

const actions = computed(() => {
  const list: (ActionEntry | false)[] = [
    { label: t('Report'), action: 'report', danger: true },
    { label: t('Mention'), action: 'mention' },
    { label: t('Reply'), action: 'reply' },
    { label: t('Ignore'), action: 'ignore' },
    (!board.snipMode || user.hasPermission('user.receivestaffbroadcasts')) && {
      label: t('Profile'),
      action: 'profile',
    },
    { label: t('Chat (un)ban'), action: 'chatban', staff: true },
    // TODO(netux): Fix infrastructure and allow purging during snip mode.
    !board.snipMode && { label: t('Purge User'), action: 'purge', staff: true },
    { label: t('Delete'), action: 'delete', staff: true },
    { label: t('Mod Lookup'), action: 'lookup-mod', staff: true },
    { label: t('Chat Lookup'), action: 'lookup-chat', staff: true },
  ];
  return list.filter((entry): entry is ActionEntry => !!entry && (user.isStaff() || !entry.staff));
});

const timestamp = computed(() =>
  props.line
    ? formatDate(
        fromUnix(props.line.date),
        `MMM Do YYYY, ${settings.chat.timestamps['24h'].value.value ? 'HH:mm:ss' : 'hh:mm:ss A'}`,
      )
    : '',
);

function run(action: ChatAction, event: MouseEvent) {
  const line = props.line;
  emit('close');
  if (line) chat.handleAction(action, { id: line.id, username: line.author }, event);
}
</script>

<template>
  <UPopover v-model:open="open" :reference="anchor ?? undefined" :content="{ side: 'bottom', align: 'center' }">
    <template #content>
      <div v-if="line" class="w-80 max-w-[90vw]" :data-popup-for="line.id">
        <header class="flex items-center gap-2 border-b border-default bg-elevated px-3 py-2">
          <ChatUserDisplay
            :author="line.author"
            :name-color="line.nameColor"
            :badges="line.badges"
            :faction="line.faction"
          />
          <UButton
            :icon="ICONS.close"
            color="neutral"
            variant="ghost"
            size="xs"
            class="ml-auto"
            @click="emit('close')"
          />
        </header>
        <div class="grid grid-cols-[1fr_auto] gap-3 p-3">
          <div class="min-w-0 text-sm">
            <p class="text-xs text-muted">{{ timestamp }}</p>
            <p class="mt-1 break-words">{{ nodesToText(line.content) }}</p>
          </div>
          <ul class="flex flex-col gap-1">
            <li v-for="entry in actions" :key="entry.action">
              <UButton
                block
                size="xs"
                :color="entry.danger ? 'error' : 'neutral'"
                :variant="entry.danger ? 'solid' : 'outline'"
                @click="run(entry.action, $event)"
              >
                {{ entry.label }}
              </UButton>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </UPopover>
</template>

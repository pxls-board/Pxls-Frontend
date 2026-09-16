<script setup lang="ts">
import type { PanelId } from '~/stores/panels';

const panels = usePanelsStore();
const chat = useChatStore();
const notifications = useNotificationsStore();
const settings = useSettings();
const { t } = useI18n();

const locked = computed(() => settings.board.lock.enable.value.value);

interface Trigger {
  panel: PanelId;
  icon: string;
  label: string;
  ping?: boolean;
  highlight?: boolean;
}

const left = computed<Trigger[]>(() => [
  { panel: 'info', icon: ICONS.info, label: t('Info') },
  { panel: 'faq', icon: ICONS.help, label: t('Help') },
  {
    panel: 'notifications',
    icon: ICONS.notifications,
    label: t('Notifications'),
    ping: notifications.unread,
    highlight: notifications.unread,
  },
]);

const right = computed<Trigger[]>(() => [
  { panel: 'settings', icon: ICONS.settings, label: t('Settings') },
  {
    panel: 'chat',
    icon: ICONS.chat,
    label: t('Chat'),
    ping: chat.triggerHasPing,
    highlight: chat.iconHasNotification,
  },
]);
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-18 mt-1.5 flex px-4 select-none">
    <div class="pointer-events-auto mr-auto flex gap-1">
      <template v-for="trigger in left" :key="trigger.panel">
        <UChip :show="!!trigger.ping" color="warning" size="lg" inset>
          <UButton
            :icon="trigger.icon"
            :aria-label="trigger.label"
            color="neutral"
            variant="solid"
            size="lg"
            class="rounded-full shadow"
            :class="{ 'text-pxls-notification': trigger.highlight }"
            @click="panels.open(trigger.panel)"
          />
        </UChip>
      </template>
    </div>
    <div class="pointer-events-auto ml-auto flex gap-1">
      <UButton
        :icon="locked ? ICONS.lock : ICONS.unlock"
        :aria-label="$t('Lock the canvas (disallow canvas drag/zoom with mouse/fingers)')"
        color="neutral"
        variant="solid"
        size="lg"
        class="rounded-full shadow"
        @click="settings.board.lock.enable.toggle()"
      />
      <template v-for="trigger in right" :key="trigger.panel">
        <UChip v-if="panels.isEnabled(trigger.panel)" :show="!!trigger.ping" color="warning" size="lg" inset>
          <UButton
            :icon="trigger.icon"
            :aria-label="trigger.label"
            color="neutral"
            variant="solid"
            size="lg"
            class="rounded-full shadow"
            :class="{ 'text-pxls-notification': trigger.highlight }"
            @click="panels.open(trigger.panel)"
          />
        </UChip>
      </template>
    </div>
  </header>
</template>

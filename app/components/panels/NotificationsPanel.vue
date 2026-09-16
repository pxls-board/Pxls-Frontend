<script setup lang="ts">
import type { PxlsNotification } from '~/types/pxls';

const notifications = useNotificationsStore();
const chat = useChatStore();
const settings = useSettings();

const fontSize = computed(() => `${settings.chat.font.size.value.value || 16}px`);

// Markdown output is DOM; render each notification once.
const bodies = computed(() => new Map(notifications.items.map((item) => [item.id, chat.processMessage(item.content)])));

function expiry(notification: PxlsNotification) {
  return {
    short: formatDate(fromUnix(notification.expiry), 'MMM DD YYYY'),
    long: formatDate(fromUnix(notification.expiry), 'MMMM DD, YYYY, hh:mm:ss A'),
  };
}
</script>

<template>
  <PxlsPanel panel="notifications" :title="$t('Notifications')" :icon="ICONS.notifications">
    <div class="divide-y divide-default" :style="{ fontSize }">
      <article v-for="notification in notifications.items" :key="notification.id" class="space-y-2 p-4">
        <header>
          <h2 class="text-lg font-semibold text-highlighted">{{ notification.title }}</h2>
        </header>
        <DomNodes :nodes="bodies.get(notification.id)" tag="div" class="pxls-markdown pxls-prose whitespace-pre-line" />
        <footer class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span v-if="notification.expiry !== 0" class="flex items-center gap-1 text-[#b66]">
            <UIcon :name="ICONS.expiry" />
            <span :title="expiry(notification).long">
              {{ $t('Expires ${expiry}', { expiry: expiry(notification).short }) }}
            </span>
          </span>
          <span v-if="notification.who" class="ml-auto">
            {{ $t('Posted by ${notification.who}', { 'notification.who': notification.who }) }}
          </span>
        </footer>
      </article>
    </div>
  </PxlsPanel>
</template>

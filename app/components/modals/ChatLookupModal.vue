<script setup lang="ts">
import type { SocketMessages } from '~/types/pxls';

const props = defineProps<{ lookup: SocketMessages['chat_lookup']; close: () => void }>();

const settings = useSettings();
const ui = useUiStore();

const is24h = computed(() => settings.chat.timestamps['24h'].value.value);
const shortFormat = computed(() => `MMM Do YYYY, ${is24h.value ? 'HH:mm' : 'hh:mm A'}`);
const longFormat = computed(() => `dddd, MMMM Do YYYY, ${is24h.value ? 'HH:mm:ss' : 'h:mm:ss a'}`);
const nameStyle = computed(() => ui.chatNameColorStyle(props.lookup.target.chatNameColor, 'color'));

function banLength(ban: SocketMessages['chat_lookup']['chatbans'][number]) {
  if (ban.type.toUpperCase().trim() === 'PERMA') return 'Permanent';
  const seconds = ban.expiry - ban.when;
  return `${seconds}s${seconds >= 60 ? ` (${humanizeDuration(seconds)})` : ''}`;
}
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2">
    <section>
      <h3 class="text-center font-semibold">
        {{ lookup.history.length > 0 ? `Last ${lookup.history.length} messages` : 'Last Messages' }}
      </h3>
      <USeparator class="my-2" />
      <ul v-if="lookup.history.length > 0" class="max-h-96 space-y-1 overflow-y-auto text-sm">
        <li
          v-for="(message, index) in lookup.history"
          :key="index"
          class="odd:bg-pxls-chat-odd"
          :class="{ 'line-through opacity-60': message.purged }"
        >
          <span :title="formatDate(message.sent * 1e3, longFormat)">{{
            formatDate(message.sent * 1e3, shortFormat)
          }}</span>
          {{ ' ' }}
          <span class="font-semibold" :class="nameStyle.class" :style="nameStyle.style">{{
            lookup.target.username
          }}</span
          >:
          <span>{{ message.content }}</span>
        </li>
      </ul>
      <p v-else>No message history</p>
    </section>
    <section>
      <h3 class="text-center font-semibold">Chat Bans</h3>
      <USeparator class="my-2" />
      <ul class="max-h-96 space-y-3 overflow-y-auto text-sm">
        <li v-for="(ban, index) in lookup.chatbans" :key="index">
          <h4 class="font-semibold">
            {{ ban.initiator_name }} {{ ban.type === 'UNBAN' ? 'un' : '' }}banned {{ lookup.target.username }}
          </h4>
          <table class="w-full text-left">
            <tbody>
              <tr>
                <th class="pr-2">Reason:</th>
                <td>{{ ban.reason || '$No reason provided$' }}</td>
              </tr>
              <tr>
                <th class="pr-2">When:</th>
                <td>{{ formatDate(ban.when * 1e3, longFormat) }}</td>
              </tr>
              <template v-if="ban.type !== 'UNBAN'">
                <tr>
                  <th class="pr-2">Length:</th>
                  <td>{{ banLength(ban) }}</td>
                </tr>
                <tr v-if="ban.type.toUpperCase().trim() !== 'PERMA'">
                  <th class="pr-2">Expiry:</th>
                  <td>{{ formatDate(ban.expiry * 1e3, longFormat) }}</td>
                </tr>
                <tr>
                  <th class="pr-2">Purged:</th>
                  <td>{{ String(ban.purged) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </li>
      </ul>
    </section>
  </div>
</template>

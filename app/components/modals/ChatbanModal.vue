<script setup lang="ts">
const props = defineProps<{ id?: number; username?: string; message: string; close: () => void }>();

const { t } = useI18n();
const board = useBoardStore();
const modal = useModalStore();

const UNBAN = '-3';
const PERMANENT = '-1';
const CUSTOM = '-2';

const lengthItems = computed(() => [
  { label: t('Unban'), value: UNBAN },
  { label: t('Permanent'), value: PERMANENT },
  { label: t('Temporary'), value: CUSTOM },
]);
const unitItems = [
  { label: 'Seconds', value: 1 },
  { label: 'Minutes', value: 60 },
  { label: 'Hours', value: 3600 },
  { label: 'Days', value: 86400 },
];
const custom = t('Custom');
const reasonItems = computed(() => [
  t('Rule 3: Spam'),
  t('Rule 1: Chat civility'),
  t('Rule 2: Hate Speech'),
  t('Rule 5: NSFW'),
  custom,
]);

const length = ref(CUSTOM);
const amount = ref(10);
const unit = ref(60);
const reason = ref(reasonItems.value[0]!);
const additional = ref('');
const purge = ref(!board.snipMode);
const silent = ref(false);
const busy = ref(false);

const isUnban = computed(() => length.value === UNBAN);
const isCustomReason = computed(() => reason.value === custom);
const truncated = computed(() =>
  props.message.length > 120 ? `${props.message.substring(0, 120)}...` : props.message,
);

async function submit() {
  const data: Record<string, string | number | boolean> = {
    type: 'temp',
    reason: t('none provided'),
    // Purges are by username, which doesn't work while everyone is -snip-.
    removalAmount: !board.snipMode && purge.value ? -1 : 0,
    announce: !silent.value,
    banLength: 0,
  };

  if (isCustomReason.value) {
    data.reason = additional.value;
  } else {
    data.reason = reason.value;
    if (additional.value) data.reason += `. ${t('Additional information:')} ${additional.value}`;
  }

  if (length.value === UNBAN) {
    data.type = 'unban';
    data.reason = '(web shell unban)';
    data.banLength = -1;
  } else if (length.value === CUSTOM) {
    data.banLength = (amount.value >> 0) * unit.value;
  } else {
    data.type = 'perma';
    data.banLength = 0;
  }

  if (props.id != null) {
    data.cmid = props.id;
  } else if (props.username) {
    data.who = props.username;
  }

  busy.value = true;
  try {
    await postForm('/admin/chatban', data);
    modal.showText(t('Chatban initiated'));
  } catch {
    modal.showText(t('Error occurred while chatbanning'));
  }
}
</script>

<template>
  <form class="chatmod-container space-y-3" @submit.prevent="submit" @keydown.stop>
    <h5>{{ id != null ? $t('Banning:') : $t('Message:') }}</h5>
    <table>
      <tbody>
        <tr v-if="id != null">
          <th>ID:</th>
          <td>{{ id }}</td>
        </tr>
        <tr v-if="id != null">
          <th>Message:</th>
          <td :title="message">{{ truncated }}</td>
        </tr>
        <tr>
          <th>User:</th>
          <td>{{ username }}</td>
        </tr>
      </tbody>
    </table>

    <UFormField :label="$t('Ban Length')">
      <USelect v-model="length" :items="lengthItems" class="w-full" />
    </UFormField>
    <div v-if="length === CUSTOM" class="flex gap-2">
      <UInputNumber v-model="amount" :min="1" :step="1" required />
      <USelect v-model="unit" :items="unitItems" />
    </div>

    <template v-if="!isUnban">
      <UFormField :label="$t('Reason')">
        <USelect v-model="reason" :items="reasonItems" class="w-full" />
      </UFormField>
      <UTextarea
        v-model="additional"
        :required="isCustomReason"
        :placeholder="isCustomReason ? $t('Custom reason') : $t('Additional information (if applicable)')"
        class="w-full"
      />
      <UFormField :label="$t('Purge Messages')">
        <p v-if="board.snipMode" class="text-sm text-warning">
          <UIcon :name="ICONS.warning" /> {{ $t('Purging all messages is disabled during snip mode') }}
        </p>
        <URadioGroup
          v-else
          v-model="purge"
          orientation="horizontal"
          :items="[
            { label: $t('Yes'), value: true },
            { label: $t('No'), value: false },
          ]"
        />
      </UFormField>
      <UCheckbox v-if="!board.snipMode" v-model="silent" :label="$t('Silent (no purge message)')" />
    </template>

    <div class="buttons">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Cancel') }}</UButton>
      <UButton color="error" type="submit" :loading="busy">{{ isUnban ? $t('Unban') : $t('Ban') }}</UButton>
    </div>
  </form>
</template>

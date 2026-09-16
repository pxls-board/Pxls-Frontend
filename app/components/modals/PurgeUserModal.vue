<script setup lang="ts">
const props = defineProps<{ id?: number; username?: string; message: string; close: () => void }>();

const { t } = useI18n();
const modal = useModalStore();
const reason = ref('');
const silent = ref(false);
const busy = ref(false);
const truncated = computed(() =>
  props.message.length > 120 ? `${props.message.substring(0, 120)}...` : props.message,
);

async function submit() {
  busy.value = true;
  try {
    await postForm('/admin/chatPurge', { who: props.username ?? '', reason: reason.value, silent: silent.value });
    modal.showText(t('User purged'));
  } catch {
    modal.showText(t('Error sending purge.'));
  }
}
</script>

<template>
  <form class="chatmod-container space-y-3" @submit.prevent="submit" @keydown.stop>
    <h5>{{ $t('Selected Message') }}</h5>
    <table>
      <tbody>
        <template v-if="id != null">
          <tr>
            <th>{{ $t('ID: ') }}</th>
            <td>{{ id }}</td>
          </tr>
          <tr>
            <th>{{ $t('Message: ') }}</th>
            <td :title="message">{{ truncated }}</td>
          </tr>
        </template>
        <tr v-else>
          <th>{{ $t('User: ') }}</th>
          <td>{{ username }}</td>
        </tr>
      </tbody>
    </table>
    <UFormField :label="$t('Purge Reason')">
      <UInput v-model="reason" class="w-full" />
    </UFormField>
    <UCheckbox v-model="silent" :label="$t('Silent (no purge message)')" />
    <div class="buttons">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Cancel') }}</UButton>
      <UButton color="error" type="submit" :loading="busy">{{ $t('Purge') }}</UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ id: number; username?: string; message: string; close: () => void }>();

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
    await postForm('/admin/delete', { cmid: props.id, reason: reason.value, silent: silent.value });
    modal.closeAll();
  } catch {
    busy.value = false;
    modal.showText(t('Failed to delete'), { modalOpts: { closeExisting: false } });
  }
}
</script>

<template>
  <form class="chatmod-container space-y-3" @submit.prevent="submit" @keydown.stop>
    <table>
      <tbody>
        <tr>
          <th>{{ $t('ID: ') }}</th>
          <td>{{ id }}</td>
        </tr>
        <tr>
          <th>{{ $t('User: ') }}</th>
          <td>{{ username }}</td>
        </tr>
        <tr>
          <th>{{ $t('Message: ') }}</th>
          <td :title="message">{{ truncated }}</td>
        </tr>
        <tr>
          <th>{{ $t('Reason: ') }}</th>
          <td><UInput v-model="reason" class="w-full" /></td>
        </tr>
      </tbody>
    </table>
    <UCheckbox v-model="silent" :label="$t('Silent (no purge message)')" />
    <div class="buttons">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Cancel') }}</UButton>
      <UButton color="error" type="submit" :loading="busy">Delete</UButton>
    </div>
  </form>
</template>

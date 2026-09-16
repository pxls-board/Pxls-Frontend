<script setup lang="ts">
const props = defineProps<{ id: number; author?: string; message: string; close: () => void }>();

const { t } = useI18n();
const toast = useToast();
const reason = ref('');
const sending = ref(false);

const preview = computed(() => (props.message.length > 60 ? `${props.message.substring(0, 60)}...` : props.message));

async function submit() {
  sending.value = true;
  try {
    await postForm('/reportChat', { cmid: props.id, report_message: reason.value });
    props.close();
    toast.add({ title: t('Sent report!'), icon: ICONS.info });
  } catch {
    toast.add({ title: t('Error sending report.'), icon: ICONS.info, color: 'error' });
    sending.value = false;
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit" @keydown.stop>
    <p>
      {{
        $t('You are reporting a chat message from ${reportTarget} with the content:', { reportTarget: author ?? '' })
      }}
      <span class="font-semibold" :title="message">{{ preview }}</span>
    </p>
    <UTextarea v-model="reason" :placeholder="$t('Enter a reason for your report')" class="w-full" autoresize />
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Cancel') }}</UButton>
      <UButton color="error" type="submit" :loading="sending">{{ $t('Report') }}</UButton>
    </div>
  </form>
</template>

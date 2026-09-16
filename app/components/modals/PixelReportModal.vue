<script setup lang="ts">
const props = defineProps<{ id: number; x: number; y: number; onSent?: () => void; close: () => void }>();

const { t } = useI18n();
const toast = useToast();
const modal = useModalStore();
const lookup = useLookupStore();

const rules = computed(() => [
  t('Rule #1: Hateful/derogatory speech or symbols'),
  t('Rule #2: Nudity, genitalia, or non-PG-13 content'),
  t('Rule #3: Multi-account'),
  t('Rule #4: Botting'),
]);
const items = computed(() => [
  ...rules.value.map((rule) => ({ label: rule, value: rule })),
  { label: t('Other (specify below)'), value: 'other' },
]);

const rule = ref(rules.value[0]!);
const details = ref('');
const sending = ref(false);

async function submit() {
  const extra = details.value.trim();
  let message = rule.value;
  if (rule.value === 'other') {
    if (!extra) {
      modal.showText(t('You must specify the details.'), { modalOpts: { closeExisting: false } });
      return;
    }
    message = extra;
  } else if (extra) {
    message += `; ${t('additional information:')} ${extra}`;
  }

  sending.value = true;
  try {
    await lookup.report(props.id, props.x, props.y, message);
    toast.add({ title: t('Sent report!'), icon: ICONS.info });
    props.onSent?.();
    props.close();
  } catch {
    toast.add({ title: t('Error sending report.'), icon: ICONS.info, color: 'error' });
    sending.value = false;
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit" @keydown.stop>
    <USelect v-model="rule" :items="items" class="w-full" />
    <UTextarea v-model="details" :placeholder="$t('Additional information (if applicable)')" class="w-full" />
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Cancel') }}</UButton>
      <UButton color="error" type="submit" :loading="sending">{{ sending ? $t('Sending...') : $t('Report') }}</UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  message: string;
  detail?: string;
  dangerous?: boolean;
  onConfirm: () => unknown;
  close: () => void;
}>();

const busy = ref(false);

async function confirm() {
  busy.value = true;
  try {
    await props.onConfirm();
  } finally {
    busy.value = false;
    props.close();
  }
}
</script>

<template>
  <div class="space-y-3">
    <p>{{ message }}</p>
    <p v-if="detail" class="max-w-full font-mono break-all">{{ detail }}</p>
    <div class="flex justify-end gap-2">
      <UButton :color="dangerous ? 'error' : 'primary'" :loading="busy" @click="confirm">{{ $t('Yes') }}</UButton>
      <UButton color="neutral" variant="outline" @click="close">{{ $t('No') }}</UButton>
    </div>
  </div>
</template>

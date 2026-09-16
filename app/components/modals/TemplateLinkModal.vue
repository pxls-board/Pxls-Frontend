<script setup lang="ts">
defineProps<{ resolve: (value: string | false) => void; close: () => void }>();

const { t } = useI18n();
type Action = Exclude<(typeof TEMPLATE_ACTIONS)[keyof typeof TEMPLATE_ACTIONS], 'ask'>;
const choice = ref<Action>(TEMPLATE_ACTIONS.NEW_TAB);

const items = computed(() => [
  { value: TEMPLATE_ACTIONS.NEW_TAB, label: t('Open in a new tab') },
  { value: TEMPLATE_ACTIONS.CURRENT_TAB, label: t('Open in current tab (replacing template)') },
  { value: TEMPLATE_ACTIONS.JUMP_ONLY, label: t('Jump to coordinates without replacing template') },
]);
</script>

<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-warning">
      {{ $t('This link will overwrite your current template. What would you like to do?') }}
    </h3>
    <URadioGroup v-model="choice" :items="items" class="pl-4" />
    <p class="text-sm text-muted">
      {{ $t('Note: You can set a default action in the settings menu which bypasses this popup completely.') }}
    </p>
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" @click="resolve(false)">{{ $t('Cancel') }}</UButton>
      <UButton @click="resolve(choice)">{{ $t('OK') }}</UButton>
    </div>
  </div>
</template>

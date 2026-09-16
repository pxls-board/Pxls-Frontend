<script setup lang="ts">
import type { Setting } from '~/stores/settings';

const props = defineProps<{ setting: Setting<boolean>; label: string; keywords?: string; description?: string }>();

const model = computed({
  get: () => props.setting.value.value,
  set: (value: boolean) => props.setting.set(value),
});
</script>

<template>
  <SettingsItem :keywords="keywords" :text="label">
    <USwitch v-model="model" :label="label" :description="description" :disabled="setting.disabled.value" />
    <slot />
  </SettingsItem>
</template>

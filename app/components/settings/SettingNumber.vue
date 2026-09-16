<script setup lang="ts">
import type { Setting } from '~/stores/settings';

const props = defineProps<{
  setting: Setting<number>;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  keywords?: string;
}>();

const model = computed({
  get: () => props.setting.value.value,
  set: (value: number | null | undefined) => {
    if (value != null) props.setting.set(value);
  },
});
</script>

<template>
  <SettingsItem :keywords="keywords" :text="label">
    <UFormField :label="label">
      <UInputNumber
        v-model="model"
        :min="min"
        :max="max"
        :step="step ?? 1"
        :step-snapping="false"
        :placeholder="placeholder"
        :disabled="setting.disabled.value"
        :format-options="{ maximumFractionDigits: 4 }"
        @keydown.stop
      />
    </UFormField>
    <slot />
  </SettingsItem>
</template>

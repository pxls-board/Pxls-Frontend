<script setup lang="ts">
import type { Setting } from '~/stores/settings';

const props = withDefaults(
  defineProps<{
    setting: Setting<number>;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    keywords?: string;
    percent?: boolean;
  }>(),
  { min: 0, max: 1, step: 0.01, keywords: undefined, percent: false },
);

const model = computed({
  get: () => props.setting.value.value,
  set: (value: number | undefined) => props.setting.set(value ?? props.setting.defaultValue),
});
</script>

<template>
  <SettingsItem :keywords="keywords" :text="label">
    <UFormField :label="label">
      <div class="flex items-center gap-3">
        <USlider v-model="model" :min="min" :max="max" :step="step" :disabled="setting.disabled.value" class="flex-1" />
        <span v-if="percent" class="w-12 text-right text-sm tabular-nums">{{ Math.floor(model * 100) }}%</span>
      </div>
    </UFormField>
    <slot />
  </SettingsItem>
</template>

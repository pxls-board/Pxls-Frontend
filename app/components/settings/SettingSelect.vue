<script setup lang="ts">
import type { Setting } from '~/stores/settings';

interface Item {
  label: string;
  value: string;
}

const props = defineProps<{
  setting: Setting<string>;
  label: string;
  items: Item[];
  keywords?: string;
}>();

// Select items can't have an empty value.
const EMPTY = '__empty__';
const encode = (value: string) => (value === '' ? EMPTY : value);
const decode = (value: string) => (value === EMPTY ? '' : value);

const encodedItems = computed(() => props.items.map((item) => ({ ...item, value: encode(item.value) })));

const model = computed({
  get: () => encode(props.setting.value.value),
  set: (value: string) => props.setting.set(decode(value)),
});
</script>

<template>
  <SettingsItem :keywords="keywords" :text="label">
    <UFormField :label="label">
      <USelect v-model="model" :items="encodedItems" class="w-full" :disabled="setting.disabled.value" />
    </UFormField>
    <slot />
  </SettingsItem>
</template>

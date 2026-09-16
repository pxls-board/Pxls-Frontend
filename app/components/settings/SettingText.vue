<script setup lang="ts">
import type { Setting } from '~/stores/settings';

const props = defineProps<{ setting: Setting<string>; label: string; placeholder?: string; keywords?: string }>();

const draft = ref(props.setting.value.value);
watch(
  () => props.setting.value.value,
  (value) => {
    draft.value = value;
  },
);

function commit() {
  props.setting.set(draft.value);
}
</script>

<template>
  <SettingsItem :keywords="keywords" :text="label">
    <UFormField :label="label">
      <UInput
        v-model="draft"
        :placeholder="placeholder"
        :disabled="setting.disabled.value"
        class="w-full"
        @change="commit"
        @keydown.enter="($event.target as HTMLInputElement).blur()"
        @keydown.stop
      />
    </UFormField>
    <slot />
  </SettingsItem>
</template>

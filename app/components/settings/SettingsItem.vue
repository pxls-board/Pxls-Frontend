<script setup lang="ts">
const props = defineProps<{ keywords?: string; text?: string }>();

const visible = useSearchItem(
  () => props.keywords,
  () => props.text,
);
</script>

<template>
  <div v-show="visible" class="space-y-1.5">
    <slot />
  </div>
</template>

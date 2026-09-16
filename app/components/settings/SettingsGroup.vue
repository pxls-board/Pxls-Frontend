<script setup lang="ts">
const props = defineProps<{ title?: string; keywords?: string }>();

const visible = useSearchContainer(() => props.keywords);
</script>

<template>
  <section v-show="visible" class="space-y-3">
    <h4 v-if="title" class="text-sm font-semibold tracking-wide text-muted uppercase">{{ title }}</h4>
    <slot />
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ message: string; sender?: string; close: () => void }>();

const chat = useChatStore();
const content = computed(() => chat.processMessage(props.message));
</script>

<template>
  <div class="space-y-3">
    <DomNodes :nodes="content" tag="p" class="pxls-markdown" />
    <p class="text-sm text-muted">Sent from {{ sender || '$Unknown' }}</p>
  </div>
</template>

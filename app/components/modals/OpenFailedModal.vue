<script setup lang="ts">
defineProps<{ url: string; close: () => void }>();
</script>

<template>
  <div class="space-y-2">
    <h3 class="font-semibold">{{ $t('Failed to automatically open in a new tab') }}</h3>
    <ULink :to="url" target="_blank" external class="text-primary underline">
      {{ $t('Click here to open in a new tab instead') }}
    </ULink>
  </div>
</template>

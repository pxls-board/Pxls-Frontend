<script setup lang="ts">
defineProps<{ message: string; reason: string; close: () => void }>();
</script>

<template>
  <div class="space-y-2">
    <p>{{ message }}</p>
    <p>{{ $t('If you think this was an error, please contact us using one of the links in the info tab.') }}</p>
    <p class="font-semibold">{{ $t('Ban reason:') }}</p>
    <p>{{ reason }}</p>
  </div>
</template>

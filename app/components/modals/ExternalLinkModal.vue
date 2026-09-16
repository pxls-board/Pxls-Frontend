<script setup lang="ts">
const props = defineProps<{ href: string; resolve: (value: boolean) => void; close: () => void }>();

const domain = computed(() => new URL(props.href).hostname.replace(/^www\./, ''));
</script>

<template>
  <div class="flex max-w-[35em] flex-col gap-3">
    <span>{{ $t('This link is taking you to the following website:') }}</span>
    <code class="break-all text-warning">{{ href }}</code>
    <span>
      {{
        $t(
          'The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?',
          [domain],
        )
      }}
    </span>
    <span class="text-sm text-muted">{{ $t('Note: You can disable this popup in settings.') }}</span>
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" @click="resolve(false)">{{ $t('Cancel') }}</UButton>
      <UButton @click="resolve(true)">{{ $t('Visit Site') }}</UButton>
    </div>
  </div>
</template>

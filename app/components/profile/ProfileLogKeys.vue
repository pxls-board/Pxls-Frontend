<script setup lang="ts">
defineProps<{ keys: Record<string, string> }>();

const copied = ref<string | null>(null);
const failed = ref<string | null>(null);

async function copy(canvas: string, key: string) {
  try {
    await navigator.clipboard.writeText(key);
    copied.value = canvas;
  } catch (error) {
    console.error('Failed to copy log key', error);
    failed.value = canvas;
  }
  setTimeout(() => {
    copied.value = null;
    failed.value = null;
  }, 1500);
}
</script>

<template>
  <UCard class="text-center">
    <h3 class="text-xl font-semibold">{{ $t('Log Keys') }}</h3>
    <p class="mt-2 flex items-center justify-center gap-1">
      <UIcon :name="ICONS.info" />
      {{ $t('Log keys can be used by those who have them to tell which pixels you placed on previous canvases.') }}
    </p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p
      class="pxls-prose"
      v-html="
        $t(
          'You can see the public <a href=&quot;https://pxls.space/extra/logs/&quot; target=&quot;_blank&quot;>Pxls Logs</a> to learn more.',
        )
      "
    />

    <table v-if="Object.keys(keys).length" class="mx-auto mt-4 text-left text-sm">
      <thead>
        <tr>
          <th class="pr-4 text-center">{{ $t('Canvas Code') }}</th>
          <th class="text-center">{{ $t('Log Key') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="(key, canvas) in keys" :key="canvas">
          <td class="py-2 pr-4 text-center align-top">{{ canvas }}</td>
          <td class="py-2">
            <code class="break-all">{{ key }}</code>
          </td>
          <td class="py-2 pl-2">
            <UButton
              :icon="copied === canvas ? ICONS.check : failed === canvas ? ICONS.warning : ICONS.copy"
              :color="copied === canvas ? 'success' : failed === canvas ? 'error' : 'primary'"
              size="sm"
              @click="copy(String(canvas), key)"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <template v-else>
      <p class="mt-4 text-warning">{{ $t('You have no log keys yet!') }}</p>
      <p class="text-warning">{{ $t('Log keys should show up here after a canvas you have placed on ends.') }}</p>
    </template>
  </UCard>
</template>

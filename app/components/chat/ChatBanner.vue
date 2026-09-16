<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';

const board = useBoardStore();
const settings = useSettings();

const enabled = computed(() => settings.ui.chat.banner.enable.value.value);
const index = ref(0);

const banners = computed(() => {
  const texts = board.webInfo?.chatBannerText ?? [];
  const processor = makeMarkdownProcessor({
    inline: [
      'coordinate',
      'emoji_raw',
      'emoji_name',
      'mention',
      'escape',
      'autoLink',
      'link',
      'url',
      'underline',
      'strong',
      'emphasis',
      'deletion',
      'code',
      'fontAwesomeIcon',
    ],
  });
  return texts.flatMap((text, i) => {
    try {
      return [renderMarkdown(processor, text)];
    } catch (error) {
      console.error(`Failed to parse chat banner text at index ${i}:`, error);
      return [];
    }
  });
});

const current = computed(
  () => banners.value[enabled.value ? index.value % Math.max(1, banners.value.length) : 0] ?? [],
);

useIntervalFn(() => {
  if (enabled.value && banners.value.length > 1) index.value++;
}, 10000);

watch(enabled, (value) => {
  // Don't show the first banner again right after re-enabling.
  if (!value) index.value = 1;
});
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition-opacity duration-500"
    leave-active-class="transition-opacity duration-500"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <DomNodes
      v-if="banners.length"
      :key="enabled ? index : 0"
      :nodes="current"
      tag="div"
      class="pxls-markdown block min-h-6 truncate px-2 py-1 text-center text-sm"
    />
  </Transition>
</template>

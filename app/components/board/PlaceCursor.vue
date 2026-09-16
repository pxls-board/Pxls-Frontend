<script setup lang="ts">
const place = usePlaceStore();
const ui = useUiStore();
const settings = useSettings();

const visible = computed(() => place.hasColor && settings.ui.cursor.enable.value.value);

function track(event: PointerEvent | TouchEvent) {
  const point = 'changedTouches' in event ? event.changedTouches[0] : event;
  if (!point) return;
  place.cursor.x = point.clientX;
  place.cursor.y = point.clientY;
}

onMounted(() => {
  window.addEventListener('pointermove', track, { passive: true });
  window.addEventListener('touchstart', track, { passive: true });
  window.addEventListener('touchmove', track, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', track);
  window.removeEventListener('touchstart', track);
  window.removeEventListener('touchmove', track);
});
</script>

<template>
  <div
    v-show="visible"
    id="cursor"
    class="pointer-events-none fixed top-5 left-2.5 z-2 size-9 rounded-[3px] border-2 border-black will-change-transform"
    :class="{ checkerboard: place.selectedColorCss === 'transparent' }"
    :style="{
      transform: `translate(${place.cursor.x}px, ${place.cursor.y}px)`,
      backgroundColor: place.selectedColorCss ?? undefined,
    }"
  >
    <div
      class="absolute h-6 min-w-6 translate-x-[15px] translate-y-5 rounded-full border border-black bg-pxls-cursor px-2 text-center leading-6 whitespace-nowrap text-pxls-cursor-text"
    >
      <UIcon v-if="place.captchaLoading" :name="ICONS.loading" class="animate-spin align-[-0.15em]" />
      {{ ui.pixelsAvailable >= 0 ? ui.stackText : $t('N/A') }}
    </div>
  </div>
</template>

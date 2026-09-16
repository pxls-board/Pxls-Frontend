<script setup lang="ts">
const board = useBoardStore();
const place = usePlaceStore();
const settings = useSettings();

const visible = computed(() => place.hasColor && settings.ui.reticule.enable.value.value);

const style = computed(() => {
  void board.viewVersion;
  const position = board.toScreen(place.reticule.x, place.reticule.y);
  const scale = board.getScale();
  return {
    left: `${position.x - 1}px`,
    top: `${position.y - 1}px`,
    width: `${scale - 1}px`,
    height: `${scale - 1}px`,
    backgroundColor: place.selectedColorCss ?? undefined,
  };
});
</script>

<template>
  <div
    v-show="visible"
    id="reticule"
    class="pointer-events-none fixed top-0 left-0 z-2 box-content border-2 border-black will-change-transform"
    :class="{ checkerboard: place.selectedColorCss === 'transparent' }"
    :style="style"
  />
</template>

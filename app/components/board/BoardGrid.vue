<script setup lang="ts">
const board = useBoardStore();
const settings = useSettings();

const style = computed(() => {
  // Recompute whenever the view changes.
  void board.viewVersion;
  const origin = board.fromScreen(0, 0, false);
  const scale = board.getScale();
  const rounded = Math.max(1, Math.floor(scale));
  const correction = scale / rounded;
  return {
    backgroundSize: `${rounded}px ${rounded}px`,
    transform: `translate(${Math.floor((-origin.x % 1) * rounded)}px, ${Math.floor((-origin.y % 1) * rounded)}px) scale(${correction})`,
    opacity: settings.board.grid.enable.value.value ? String((scale - 2) / 6) : '0',
  };
});
</script>

<template>
  <div
    id="grid"
    class="pointer-events-none fixed top-0 left-0 z-1 h-[110vh] w-[110vw] origin-top-left bg-[linear-gradient(to_right,#aaa_1px,transparent_1px),linear-gradient(to_bottom,#aaa_1px,transparent_1px)]"
    :style="style"
  />
</template>

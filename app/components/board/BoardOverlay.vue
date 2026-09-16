<script setup lang="ts">
import type { Overlay } from '~/stores/overlays';

const props = defineProps<{ overlay: Overlay }>();

const overlays = useOverlaysStore();
const host = ref<HTMLElement | null>(null);
const state = computed(() => overlays.state[props.overlay.name]);

onMounted(() => host.value?.append(props.overlay.canvas));

watchEffect(() => {
  const canvas = props.overlay.canvas;
  const current = state.value;
  canvas.className = classNames(
    'pointer-events-none absolute top-0 left-0 select-none',
    current?.pixelated && 'pixelated',
    !current?.shown && 'opacity-0',
  );
  canvas.style.opacity = current?.shown ? String(current.opacity) : '0';
});

onBeforeUnmount(() => props.overlay.canvas.remove());
</script>

<template>
  <div ref="host" class="contents" />
</template>

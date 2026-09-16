<script setup lang="ts">
/**
 * Mounts pre-built DOM nodes (markdown output, admin script content).
 * Nodes can only live in one place, so pass clones when rendering twice.
 */
const props = withDefaults(
  defineProps<{
    nodes?: Node | Node[] | { jquery: string; get(): Node[] } | null;
    tag?: string;
  }>(),
  { nodes: null, tag: 'span' },
);

const root = ref<HTMLElement | null>(null);

function toArray(value: typeof props.nodes): Node[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Node) return [value];
  if (typeof value === 'object' && 'jquery' in value) return value.get();
  return [];
}

watch(
  [root, () => props.nodes],
  ([element]) => {
    if (!element) return;
    element.replaceChildren(...toArray(props.nodes));
  },
  { immediate: true, flush: 'post' },
);
</script>

<template>
  <component :is="tag" ref="root" />
</template>

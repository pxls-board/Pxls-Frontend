<script setup lang="ts">
const props = defineProps<{
  /** Key for the persisted collapsed state. */
  sectionId?: string;
  title: string;
  titleClass?: string;
}>();

const collapsed = useCollapseState(() => props.sectionId);
</script>

<template>
  <article :data-id="sectionId" class="border-b border-default last:border-b-0">
    <header>
      <button
        type="button"
        class="flex w-full items-center justify-between gap-2 bg-elevated/60 px-4 py-2 text-left hover:bg-elevated"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <h3 class="text-base font-semibold" :class="titleClass">{{ title }}</h3>
        <UIcon :name="ICONS.collapse" class="size-5 transition-transform" :class="{ '-rotate-90': collapsed }" />
      </button>
    </header>
    <div v-show="!collapsed" class="space-y-3 px-4 py-3">
      <slot />
    </div>
  </article>
</template>

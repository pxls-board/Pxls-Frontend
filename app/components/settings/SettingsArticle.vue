<script setup lang="ts">
const props = defineProps<{ sectionId: string; title: string; keywords?: string }>();

const visible = useSearchContainer(() => props.keywords);
const collapsed = useCollapseState(() => props.sectionId);
const store = useSettingsStore();

// Searching always expands matching sections.
const expanded = computed(() => !collapsed.value || store.search.trim() !== '');
</script>

<template>
  <article v-show="visible" :data-id="sectionId" class="border-b border-default">
    <header>
      <button
        type="button"
        class="flex w-full items-center justify-between gap-2 bg-elevated/60 px-4 py-2 text-left hover:bg-elevated"
        :aria-expanded="expanded"
        @click="collapsed = !collapsed"
      >
        <h3 class="text-base font-semibold">{{ title }}</h3>
        <UIcon :name="ICONS.collapse" class="size-5 transition-transform" :class="{ '-rotate-90': !expanded }" />
      </button>
    </header>
    <div v-show="expanded" class="space-y-4 px-4 py-3">
      <slot />
    </div>
  </article>
</template>

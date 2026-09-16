<script setup lang="ts">
import type { PanelId } from '~/stores/panels';

const props = withDefaults(
  defineProps<{
    panel: PanelId;
    title: string;
    icon: string;
    /** Use half the screen instead of the default ~30% width. */
    wide?: boolean;
    /** Dock to the bottom of the screen (horizontal chat). */
    bottom?: boolean;
    /** The content manages its own scrolling and fills the panel. */
    fill?: boolean;
    /** DOM id of the panel (kept from the old markup for scripts). */
    domId?: string;
  }>(),
  { wide: false, bottom: false, fill: false, domId: undefined },
);

const panels = usePanelsStore();

const open = computed({
  get: () => panels.isOpen(props.panel),
  set: (value: boolean) => panels.setOpen(props.panel, value),
});

const side = computed(() => (props.bottom ? 'bottom' : panels.sideOf(props.panel)));

const widthClass = computed(() => {
  if (props.bottom) return 'h-[40vh] max-h-[40vh]';
  return props.wide ? 'w-full sm:w-1/2 sm:max-w-none' : 'w-full sm:w-[max(30%,300px)] sm:max-w-none';
});
</script>

<template>
  <USlideover
    v-model:open="open"
    :side="side"
    :modal="false"
    :overlay="false"
    :dismissible="false"
    :content="{ 'id': domId, 'data-panel': panel } as Record<string, string>"
    :ui="{
      content: `${widthClass} z-21 bg-pxls-panel shadow-2xl synthwave:bg-linear-to-r synthwave:from-[#2a0161] synthwave:to-[#180027] terminal:border-[#004e00]`,
      header: 'bg-pxls-panel-header px-4 py-3 sm:px-4 min-h-0',
      body: fill ? 'flex min-h-0 flex-col overflow-hidden p-0 sm:p-0' : 'p-0 sm:p-0',
    }"
  >
    <template #header="{ close }">
      <div class="flex w-full items-center gap-2">
        <slot name="header-left" />
        <h2 class="flex flex-1 items-center gap-2 truncate text-lg font-semibold text-highlighted">
          <UIcon :name="icon" class="size-5 shrink-0" />
          <span class="truncate">{{ title }}</span>
          <slot name="title-extra" />
        </h2>
        <slot name="header-right" />
        <UButton
          :icon="ICONS.close"
          color="error"
          variant="ghost"
          :aria-label="$t('Close Panel')"
          :title="$t('Close Panel')"
          @click="close"
        />
      </div>
    </template>
    <template #body>
      <slot />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
const place = usePlaceStore();
const settings = useSettings();

const numbered = computed(() => settings.ui.palette.numbers.enable.value.value);
const thinScrollbar = computed(() => settings.ui.palette.scrollbar.thin.enable.value.value);
const stacking = computed(() => settings.ui.palette.stacking.enable.value.value);
const brightness = computed(() =>
  settings.ui.brightness.enable.value.value ? `brightness(${settings.ui.brightness.value.value.value})` : undefined,
);
const hasTouch = 'ontouchstart' in window;

const paletteElement = ref<HTMLElement | null>(null);

// Keep the selected color scrolled into view.
watch(
  () => place.color,
  async (color) => {
    if (color === -1) return;
    await nextTick();
    paletteElement.value
      ?.querySelector(`[data-idx="${color}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  },
);

function onWheel(event: WheelEvent) {
  place.scrollColor(event.deltaY);
}

const buttonClass = (active: boolean) => [
  'relative m-1.5 inline-block cursor-pointer align-top transition-[bottom]',
  active ? 'bottom-2' : 'bottom-0',
  !hasTouch && !active && 'hover:bottom-2',
];
</script>

<template>
  <div
    id="palette"
    ref="paletteElement"
    class="relative z-6 mx-auto overflow-x-auto bg-pxls-palette px-1 py-2.5 text-center synthwave:bg-linear-to-l synthwave:from-[#5c0058d1] synthwave:to-[#2c1c57cc] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[#aaa] [&::-webkit-scrollbar-track]:bg-transparent"
    :class="[stacking ? 'whitespace-normal' : 'whitespace-nowrap', { '[scrollbar-width:thin]': thinScrollbar }]"
    @wheel.passive="onWheel"
  >
    <button
      type="button"
      data-idx="-1"
      :aria-label="$t('Clear color')"
      :class="buttonClass(place.hasColor)"
      class="text-3xl text-default"
      @click="place.switchColor(-1)"
    >
      <UIcon :name="ICONS.close" class="size-8" />
    </button>
    <button
      v-show="place.specialColorsVisible"
      type="button"
      :data-idx="TRANSPARENT_COLOR"
      :class="buttonClass(place.color === TRANSPARENT_COLOR)"
      @click="place.switchColor(TRANSPARENT_COLOR)"
    >
      <span class="relative inline-block min-h-8 min-w-8 rounded-[3px] border-2 border-black checkerboard pixelated" />
    </button>
    <button
      v-for="(color, index) in place.palette"
      :key="index"
      type="button"
      :data-idx="index"
      :title="color.name"
      :class="buttonClass(place.color === index)"
      @click="place.switchColor(index)"
    >
      <span
        class="relative inline-block min-h-8 min-w-8 rounded-[3px] border-2 border-black"
        :style="{ backgroundColor: `#${color.value}`, filter: brightness }"
      >
        <span
          v-if="numbered"
          class="absolute bottom-full left-1/2 w-6 -translate-x-1/2 translate-y-1/2 rounded-full border border-black bg-white text-center text-xs text-black select-none dark:bg-[#474a48] dark:text-white"
        >
          {{ index }}
        </span>
      </span>
    </button>
  </div>
</template>

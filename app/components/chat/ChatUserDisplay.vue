<script setup lang="ts">
import type { Badge, StrippedFaction } from '~/types/pxls';

const props = defineProps<{
  author: string;
  nameColor: number;
  badges: Badge[];
  faction: StrippedFaction | null;
  mention?: boolean;
  interactive?: boolean;
}>();

const emit = defineEmits<{
  nameClick: [event: MouseEvent];
  nameMiddleClick: [event: MouseEvent];
}>();

const settings = useSettings();
const board = useBoardStore();
const ui = useUiStore();

const nameStyle = computed(() => ui.chatNameColorStyle(props.nameColor, 'color'));
const showBadges = computed(() => settings.chat.badges.enable.value.value);
const showFaction = computed(() => !!props.faction && settings.chat.factiontags.enable.value.value && !board.snipMode);
const factionTag = computed(() => {
  if (!props.faction?.tag) return null;
  const span = document.createElement('span');
  span.textContent = `[${props.faction.tag}]`;
  twemoji.parse(span);
  return [...span.childNodes];
});

function onMouseDown(event: MouseEvent) {
  if (event.button === 1) {
    event.preventDefault();
    emit('nameMiddleClick', event);
  }
}
</script>

<template>
  <span class="userDisplay">
    <span class="flairs">
      <template v-for="(badge, index) in badges" :key="index">
        <span
          v-if="badge.type === 'text' && showBadges"
          class="mr-1 rounded-full bg-accented px-2 py-0.5 text-[0.8em] leading-none"
          :title="badge.tooltip"
        >
          {{ badge.displayName }}
        </span>
        <span v-else-if="badge.type === 'icon'" class="mr-1 inline-flex align-[-0.15em]" :title="badge.tooltip">
          <UIcon :name="iconFromFontAwesome(badge.cssIcon ?? '')" />
        </span>
      </template>
      <DomNodes
        v-if="showFaction && factionTag"
        :nodes="factionTag"
        class="mr-1 [&_.emoji]:inline-block [&_.emoji]:h-[1.1em]"
        :style="{ color: intToHex(faction!.color) }"
        :title="`${faction!.name} (ID: ${faction!.id})`"
      />
    </span>
    <span
      class="user font-bold"
      :class="[nameStyle.class, interactive && 'cursor-pointer hover:underline']"
      :style="nameStyle.style"
      @click="interactive && emit('nameClick', $event)"
      @mousedown="interactive && onMouseDown($event)"
    >
      {{ mention ? '@' : '' }}{{ board.snipMode ? '-snip-' : author }}
    </span>
  </span>
</template>

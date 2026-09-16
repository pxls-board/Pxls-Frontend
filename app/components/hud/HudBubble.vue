<script setup lang="ts">
const settings = useSettings();
const user = useUserStore();
const ui = useUiStore();
const timer = useTimerStore();
const coords = useCoordsStore();
const place = usePlaceStore();
const board = useBoardStore();
const modal = useModalStore();
const { t } = useI18n();

const position = computed(() => settings.ui.bubble.position.value.value.split(' '));
const isTop = computed(() => position.value.includes('top'));
const isRight = computed(() => position.value.includes('right'));
const compact = computed(() => settings.ui.bubble.compact.value.value);
const animations = computed(() => ui.bubbleAnimations);

// The plusone/pulse previews show the placement info even during a cooldown.
const showCooldown = computed(
  () => timer.counting && !animations.value.has('plusone') && !animations.value.has('pulse'),
);

const coordsText = computed(() => (coords.mouse ? `(${coords.mouse.x}, ${coords.mouse.y})` : '(???, ???)'));

const numberFormat = (value: number | null) => (value == null ? t('N/A') : value.toLocaleString());

function confirmSignOut() {
  modal.showComponent(
    defineAsyncComponent(() => import('~/components/modals/ConfirmModal.vue')),
    {
      message: t('Are you sure you want to sign out?'),
      dangerous: true,
      onConfirm: () => user.doSignOut(),
    },
    { title: t('Sign Out') },
  );
}

const collapseIcon = computed(() => {
  // Arrow points toward where the bubble collapses.
  if (compact.value) return isRight.value ? ICONS.back : ICONS.jump;
  return isTop.value ? ICONS.expand : ICONS.collapse;
});
</script>

<template>
  <div
    id="main-bubble"
    class="pointer-events-auto absolute flex min-w-44 overflow-hidden rounded-xl bg-pxls-bubble text-pxls-bubble-text shadow-lg backdrop-blur-sm terminal:border terminal:border-[#94e044] synthwave:bg-linear-to-b synthwave:from-black/80 synthwave:to-[#1f0f4c]/80 synthwave:shadow-[0_0_12px_#fc79ec80]"
    :class="[
      isTop ? 'top-16' : 'bottom-4',
      isRight ? 'right-4' : 'left-4',
      compact ? (isRight ? 'flex-row' : 'flex-row-reverse') : isTop ? 'flex-col-reverse' : 'flex-col',
      {
        'animate-pxls-shake': animations.has('shake'),
        'animate-pxls-bump': animations.has('bump'),
      },
    ]"
  >
    <button
      type="button"
      class="flex items-center justify-center text-lg transition-colors hover:bg-white/15"
      :class="
        compact
          ? ['w-8', isRight ? 'border-r border-white/20' : 'border-l border-white/20']
          : ['h-6 w-full', isTop ? 'mt-2 border-t border-white/20' : 'mb-2 border-b border-white/20']
      "
      :aria-label="compact ? $t('Expand') : $t('Collapse')"
      @click="settings.ui.bubble.compact.toggle()"
    >
      <UIcon :name="collapseIcon" />
    </button>

    <div class="flex flex-col gap-1 p-4" :class="[compact ? 'text-lg font-bold' : isTop ? 'pb-0' : 'pt-0']">
      <template v-if="!compact">
        <div v-if="user.showUserInfo" class="flex items-center gap-1.5">
          <UIcon :name="ICONS.user" class="size-5 shrink-0" />
          <a
            :href="`/profile/${user.username}`"
            target="_blank"
            :title="$t('My Profile')"
            class="truncate hover:underline"
          >
            {{ user.username }}
          </a>
          <button
            type="button"
            class="ml-auto opacity-80 hover:opacity-100"
            :title="$t('Logout')"
            @click="confirmSignOut"
          >
            <UIcon :name="ICONS.logout" class="size-5" />
          </button>
        </div>
        <template v-if="user.loggedIn">
          <div class="flex items-center gap-1.5">
            <UIcon :name="ICONS.canvasPixels" class="size-5 shrink-0" />
            <span class="font-bold">{{ $t('Canvas:') }}</span>
            <span>{{ numberFormat(user.pixelCount) }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon :name="ICONS.allTimePixels" class="size-5 shrink-0" />
            <span class="font-bold">{{ $t('All Time:') }}</span>
            <span>{{ numberFormat(user.pixelCountAllTime) }}</span>
          </div>
        </template>
        <div class="mb-2 flex items-center gap-1.5">
          <UIcon :name="ICONS.online" class="size-5 shrink-0" />
          <span class="font-bold">{{ $t('Online:') }}</span>
          <span v-if="user.onlineCount === null" v-html="$t('Loading online user count&hellip;')" />
          <span v-else>{{ user.onlineCount }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon :name="board.allowDrag ? ICONS.coords : ICONS.lock" class="size-5 shrink-0" />
          <button
            type="button"
            class="rounded px-0.5 font-mono transition-colors"
            :class="{ 'animate-pxls-copy-pulse': coords.copyPulse }"
            @click="coords.copyCoords(true)"
          >
            {{ coordsText }}
          </button>
        </div>
      </template>

      <div v-if="!showCooldown" class="flex items-center gap-1.5 font-bold">
        <UIcon :name="ICONS.pixels" class="size-5 shrink-0" />
        <span v-if="!compact">{{ $t('Pixels') }}:</span>
        <span class="relative mr-4" :class="{ 'animate-[pxls-copy-pulse_0.33s_linear_3]': animations.has('pulse') }">
          {{ ui.pixelsAvailable >= 0 ? ui.stackText : $t('N/A') }}
          <span
            v-if="animations.has('plusone')"
            class="absolute bottom-1/4 left-[110%] animate-pxls-plusone text-base font-bold"
            aria-hidden="true"
          >
            +1
          </span>
        </span>
        <UIcon v-if="place.captchaLoading" :name="ICONS.loading" class="animate-spin" />
      </div>
      <div v-else class="flex items-center gap-1.5 font-bold">
        <UIcon :name="ICONS.cooldown" class="size-5 shrink-0" />
        <span>{{ timer.currentTimer }}</span>
      </div>
    </div>
  </div>
</template>

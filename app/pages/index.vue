<script setup lang="ts">
import { installPublicApi } from '~/api/install';

const config = useRuntimeConfig();
const board = useBoardStore();
const panels = usePanelsStore();
const ui = useUiStore();
const socket = useSocket();
const settings = useSettings();
const { $pxlsInstaban } = useNuxtApp();
const { t } = useI18n();

useHead({
  title: config.public.title,
  meta: [{ name: 'description', content: () => t('Place pixels with people to create art') }],
});

useKeybinds();

const ready = computed(() => board.webInfo !== null);
const horizontalChat = computed(() => settings.ui.chat.horizontal.enable.value.value);

// Keep the HUD clear of open side panels.
const hudStyle = computed(() => {
  const style: Record<string, string> = {};
  if (panels.leftPanel) {
    style.left = panels.leftPanel === 'faq' ? '50%' : 'max(30%, 300px)';
  }
  if (panels.rightPanel && !(panels.rightPanel === 'chat' && horizontalChat.value)) {
    style.right = 'max(30%, 300px)';
  }
  if (panels.rightPanel === 'chat' && horizontalChat.value) {
    style.bottom = '40vh';
  }
  return style;
});

onMounted(async () => {
  document.title = config.public.title;
  if (ls.get('seen_initial_info') !== true) {
    ls.set('seen_initial_info', true);
    panels.open('info');
  }
  await bootstrapPxls($pxlsInstaban as boolean);
  installPublicApi();

  console.info('%cHey, be careful!', 'color: red; font-size: 24px;');
  console.info("%cIt's safer to close this unless you KNOW what you're doing.", 'font-size: 16px;');
  console.info(
    '%cDeveloper documentation can be found here: https://github.com/pxlsspace/Pxls/blob/main/docs/developer.md',
    'font-size: 14px;',
  );
});
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-pxls-canvas text-default">
    <HudHeader />

    <div
      v-if="socket.reconnecting.value"
      id="reconnecting"
      class="fixed inset-x-0 top-0 z-98 bg-error py-2 text-center font-semibold text-inverted"
    >
      {{ $t('Lost connection to server, reconnecting...') }}
    </div>

    <main>
      <BoardView v-show="ready" />

      <div
        v-show="ready"
        id="ui"
        class="pointer-events-none fixed inset-0 z-9 flex cursor-default flex-col transition-[left,right,bottom] duration-250 ease-in-out select-none"
        :style="hudStyle"
      >
        <div id="ui-top" class="relative h-full">
          <div
            v-if="ui.loadingBubbleVisible"
            id="loading-bubble"
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[rgb(251_106_0/0.7)] px-4 py-3 text-white shadow"
          >
            <!-- eslint-disable vue/no-v-html -->
            <div v-if="ui.loadingStates.heatmap" v-html="$t('Loading Heatmap (press <kbd>H</kbd> to cancel)')" />
            <div v-if="ui.loadingStates.virginmap" v-html="$t('Loading Virginmap (press <kbd>X</kbd> to cancel)')" />
            <!-- eslint-enable vue/no-v-html -->
          </div>
          <HudBubble />
        </div>
        <HudBottom />
      </div>
    </main>

    <Transition leave-active-class="transition-opacity duration-500" leave-to-class="opacity-0">
      <div
        v-if="!ready"
        id="loading"
        class="fixed inset-0 z-50 flex items-center justify-center bg-pxls-canvas text-2xl font-semibold"
      >
        <span class="flex items-center gap-3">
          <UIcon :name="ICONS.loading" class="animate-spin" />
          {{ $t('Loading...') }}
        </span>
      </div>
    </Transition>

    <BoardReticule />
    <PlaceCursor />
    <LookupPopup />

    <!-- Hosts used by the staff admin script. -->
    <div id="messages" />
    <div id="prompt" class="hidden" />
    <div id="g-recaptcha" />

    <DragDropOverlay />
    <SignInDialog />
    <SignupDialog />

    <InfoPanel />
    <FaqPanel />
    <NotificationsPanel />
    <SettingsPanel />
    <ChatPanel v-if="settings.chat.enable.get()" />
  </div>
</template>

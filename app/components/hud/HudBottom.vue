<script setup lang="ts">
const place = usePlaceStore();
const user = useUserStore();
const modal = useModalStore();
const { t } = useI18n();

const loginOverlayVisible = computed(() => !user.loggedIn);

const legalHtml = computed(() => {
  const { termsUrl, privacyUrl } = user.legal;
  if (!termsUrl) return '';
  return t(
    'By logging in or registering, you agree to the <a href="{0}" target="_blank">terms of use</a> and <a href="{1}" target="_blank">privacy policy</a>.',
    [termsUrl, privacyUrl ?? ''],
  );
});

const singleService = computed(() => (user.authServices.length === 1 ? user.authServices[0] : null));

function signIn(event: MouseEvent) {
  if (singleService.value) {
    user.startSignIn(singleService.value, event);
    return;
  }
  event.preventDefault();
  user.signInPromptOpen = true;
}

function openRename() {
  modal.showComponent(
    defineAsyncComponent(() => import('~/components/modals/RenameModal.vue')),
    {},
    { title: t('Rename Requested') },
  );
}
</script>

<template>
  <div id="ui-bottom" class="pointer-events-auto relative z-6 w-full">
    <button
      id="undo"
      type="button"
      class="flex w-full items-center justify-center overflow-hidden bg-linear-to-t from-white/80 to-white text-lg font-bold text-black transition-[height] duration-250 ease-in-out dark:from-black/50 dark:to-black dark:text-white"
      :class="place.canUndo ? 'h-8 border-t border-black' : 'h-0'"
      @click.stop="place.undo()"
    >
      <span class="transition-opacity" :class="{ 'opacity-0': !place.canUndo }">{{ $t('Undo') }}</span>
    </button>

    <div class="relative">
      <div
        v-if="loginOverlayVisible"
        id="login-overlay"
        class="absolute inset-0 z-9 flex flex-col items-center justify-center gap-1 bg-pxls-overlay px-2 text-center font-bold"
      >
        <div id="sign-in-with" class="flex flex-wrap items-center justify-center gap-x-2">
          <span>{{ $t('You are not signed in.') }}</span>
          <a
            :href="singleService ? `/signin/${singleService.id}?redirect=1` : '#'"
            class="text-primary underline underline-offset-2"
            @click="signIn"
          >
            {{ singleService ? $t('Sign in with {0}', [singleService.name]) : $t('Sign in with...') }}
          </a>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-if="legalHtml" id="legal" class="text-xs font-normal [&_a]:underline" v-html="legalHtml" />
      </div>

      <div
        v-else-if="user.banned || user.renameRequested"
        id="user-message"
        class="absolute inset-0 z-9 flex items-center justify-center bg-pxls-overlay px-2 text-center font-bold"
      >
        <span v-if="user.banned">{{ $t('You can contact us using one of the links in the info menu.') }}</span>
        <span v-else>
          {{ $t('You must change your username.') }}
          <button type="button" class="cursor-pointer underline" @click="openRename">
            {{ $t('Click here to continue.') }}
          </button>
        </span>
      </div>

      <HudPalette />
    </div>
  </div>
</template>

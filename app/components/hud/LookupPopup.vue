<script setup lang="ts">
import type { LookupHookValue } from '~/stores/lookup';

const lookup = useLookupStore();
const user = useUserStore();
const template = useTemplateStore();
const modal = useModalStore();
const settings = useSettings();
const { t } = useI18n();

const hideSensitive = computed({
  get: () => settings.lookup.filter.sensitive.enable.value.value,
  set: (value: boolean) => settings.lookup.filter.sensitive.enable.set(value),
});

const data = computed(() => lookup.current);

const rows = computed(() => {
  const current = data.value;
  if (!current || lookup.error) return [];
  const hooks = current.bg ? lookup.hooks.filter((hook) => hook.backgroundCompatible) : lookup.hooks;
  return hooks
    .map((hook) => {
      let value: LookupHookValue;
      try {
        value = hook.get(current);
      } catch (error) {
        console.error(`Lookup hook "${hook.id}" failed:`, error);
        return null;
      }
      if (value == null) return null;
      return { hook, value };
    })
    .filter((row) => row !== null);
});

const hasSensitive = computed(() => rows.value.some((row) => row.hook.sensitive));

function isNodeValue(value: LookupHookValue): value is Node | { jquery: string; get(): Node[] } {
  return typeof value === 'object' && value !== null;
}

function report() {
  const current = data.value;
  if (!current?.id) return;
  modal.showComponent(
    defineAsyncComponent(() => import('~/components/modals/PixelReportModal.vue')),
    { id: current.id, x: current.x, y: current.y, onSent: () => lookup.hide() },
    { title: t('Report Pixel') },
  );
}

function moveTemplateHere() {
  if (!data.value) return;
  template.queueUpdate({ ox: data.value.x, oy: data.value.y });
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="lookup.visible && data"
      id="lookup"
      class="fixed top-16 left-1/2 z-22 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-default bg-default p-4 text-default shadow-xl"
    >
      <div class="content space-y-1 text-sm">
        <p v-if="lookup.error" class="text-error">
          {{
            $t(
              "An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds",
            )
          }}
        </p>
        <template v-else>
          <p v-if="data.bg">{{ $t('This pixel is background (was not placed by a user).') }}</p>
          <div
            v-for="{ hook, value } in rows"
            v-show="!(hook.sensitive && hideSensitive)"
            :id="`lookuphook_${hook.id}`"
            :key="hook.id"
            :data-sensitive="hook.sensitive"
          >
            <b>{{ hook.name }}: </b>
            <DomNodes v-if="isNodeValue(value)" :nodes="value" :style="hook.css" />
            <span v-else :style="hook.css">{{ value }}</span>
          </div>
          <UCheckbox
            v-if="!data.bg && hasSensitive"
            v-model="hideSensitive"
            :label="$t('Hide sensitive information')"
            class="pt-2"
          />
        </template>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <UButton v-if="!data.bg && !lookup.error && user.loggedIn" color="error" size="sm" @click="report">
          {{ $t('Report') }}
        </UButton>
        <div class="ml-auto flex gap-2">
          <UButton v-if="template.options.use" color="neutral" variant="outline" size="sm" @click="moveTemplateHere">
            {{ $t('Move Template Here') }}
          </UButton>
          <UButton color="neutral" variant="outline" size="sm" @click="lookup.hide()">
            {{ $t('Close') }}
          </UButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ username?: string; close: () => void }>();

const { t } = useI18n();
const modal = useModalStore();
const state = ref(false);
const error = ref('');
const busy = ref(false);

async function submit() {
  busy.value = true;
  error.value = '';
  try {
    await postForm('/admin/flagNameChange', { user: props.username ?? '', flagState: state.value });
    modal.showText(t('Rename request updated'));
  } catch (caught) {
    busy.value = false;
    error.value =
      caught instanceof HttpError
        ? await readErrorDetails(caught.response)
        : t('An unknown error occurred. Please contact a developer');
  }
}
</script>

<template>
  <form class="chatmod-container space-y-3" @submit.prevent="submit" @keydown.stop>
    <h3 class="font-semibold">{{ $t('Toggle Rename Request') }}</h3>
    <p>{{ $t('Select one of the options below to set the current rename request state.') }}</p>
    <URadioGroup
      v-model="state"
      orientation="horizontal"
      :items="[
        { label: $t('On'), value: true },
        { label: $t('Off'), value: false },
      ]"
    />
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p v-if="error" class="text-sm font-bold text-error" v-html="error" />
    <div class="buttons">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Cancel') }}</UButton>
      <UButton type="submit" :loading="busy">{{ $t('Set') }}</UButton>
    </div>
  </form>
</template>

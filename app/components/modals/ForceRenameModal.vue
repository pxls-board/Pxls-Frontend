<script setup lang="ts">
const props = defineProps<{ username?: string; close: () => void }>();

const { t } = useI18n();
const modal = useModalStore();
const name = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  busy.value = true;
  error.value = '';
  try {
    await postForm('/admin/forceNameChange', { user: props.username ?? '', newName: name.value.trim() });
    modal.showText(t('User renamed'));
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
    <p>
      {{
        $t(
          "Enter the new name for the user below. Please note that if you're trying to change the caps, you'll have to rename to something else first.",
        )
      }}
    </p>
    <UFormField :label="$t('New Name: ')" required>
      <UInput v-model="name" required class="w-full" />
    </UFormField>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p v-if="error" class="text-sm font-bold text-error" v-html="error" />
    <div class="buttons">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Cancel') }}</UButton>
      <UButton type="submit" :loading="busy">{{ $t('Set') }}</UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ close: () => void }>();

const user = useUserStore();
const name = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  busy.value = true;
  const result = await user.execNameChange(name.value);
  busy.value = false;
  if (result === null) {
    props.close();
  } else {
    error.value = result;
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit" @keydown.stop>
    <p>
      {{ $t('Staff have required you to change your username, this usually means your name breaks one of our rules.') }}
    </p>
    <p>{{ $t('If you disagree, please contact us on Discord (link in the info panel).') }}</p>
    <UFormField :label="$t('New Username:')" required>
      <UInput v-model="name" required class="w-full" :disabled="busy" />
    </UFormField>
    <!-- The server may send HTML details. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p v-if="error" class="text-sm font-bold text-error" v-html="error" />
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" type="button" @click="close">{{ $t('Not now') }}</UButton>
      <UButton type="submit" :loading="busy">{{ $t('Change') }}</UButton>
    </div>
  </form>
</template>

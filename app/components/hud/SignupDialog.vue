<script setup lang="ts">
const user = useUserStore();

const username = ref('');
const discord = ref('');
const error = ref('');
const submitting = ref(false);

const open = computed({
  get: () => user.pendingSignupToken !== null,
  set: (value: boolean) => {
    if (!value) user.pendingSignupToken = null;
  },
});

async function submit() {
  submitting.value = true;
  const result = await user.doSignup(username.value, discord.value);
  submitting.value = false;
  if (result === null) {
    username.value = '';
    discord.value = '';
    error.value = '';
  } else {
    error.value = result;
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="$t('Sign up')" :description="$t('Pick a username')" :dismissible="false">
    <template #body>
      <form id="signup" class="space-y-4" @submit.prevent="submit" @keydown.stop>
        <UFormField :label="$t('Username:')" required>
          <UInput v-model="username" maxlength="32" class="w-full" autofocus />
        </UFormField>
        <UFormField :label="$t('Discord Tag (Optional):')">
          <UInput v-model="discord" maxlength="64" placeholder="username1234" class="w-full" />
        </UFormField>
        <p v-if="error" class="text-sm text-error">{{ error }}</p>
      </form>
    </template>
    <template #footer>
      <UButton class="ml-auto" type="submit" form="signup" :loading="submitting">{{ $t('Sign up') }}</UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const user = useUserStore();
</script>

<template>
  <UModal v-model:open="user.signInPromptOpen" :title="$t('Sign in with...')">
    <template #body>
      <ul class="space-y-2">
        <li v-for="service in user.authServices" :key="service.id" class="flex items-center gap-2">
          <UButton
            :to="`/signin/${service.id}?redirect=1`"
            external
            color="neutral"
            variant="outline"
            @click="user.startSignIn(service, $event)"
          >
            {{ service.name }}
          </UButton>
          <UBadge v-if="!service.registrationEnabled" color="error" variant="subtle">
            {{ $t('New Accounts Disabled') }}
          </UBadge>
        </li>
      </ul>
    </template>
    <template #footer="{ close }">
      <UButton class="ml-auto" color="neutral" variant="outline" @click="close">{{ $t('Cancel') }}</UButton>
    </template>
  </UModal>
</template>

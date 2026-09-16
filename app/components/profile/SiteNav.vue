<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

defineProps<{ selfName?: string | null; pageTitle?: string; pageLink?: string }>();

const config = useRuntimeConfig();
const { t } = useI18n();

const menu = computed<DropdownMenuItem[]>(() => [
  { label: t('My Profile'), icon: ICONS.profile, to: '/profile?action=details' },
  { label: t('My Factions'), icon: ICONS.factions, to: '/profile?action=factions' },
  { label: t('My Data'), icon: ICONS.image, to: '/profile?action=data' },
]);
</script>

<template>
  <header class="border-b border-default bg-elevated/70 backdrop-blur">
    <nav class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
      <a href="/" class="font-semibold text-highlighted hover:text-primary">{{ config.public.title }}</a>
      <ULink v-if="pageTitle && pageLink" :to="pageLink" class="text-sm text-muted hover:text-default" active-class="">
        {{ pageTitle }}
      </ULink>
      <UDropdownMenu v-if="selfName" :items="menu" class="ml-auto">
        <UButton :icon="ICONS.user" color="neutral" variant="ghost" :trailing-icon="ICONS.collapse">
          {{ selfName }}
        </UButton>
      </UDropdownMenu>
    </nav>
  </header>
</template>

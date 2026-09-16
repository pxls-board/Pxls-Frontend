<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import type { ProfileData } from '~/types/profile';

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const toast = useToast();
const { t } = useI18n();

const name = computed(() => (typeof route.params.name === 'string' ? route.params.name : ''));

const { data, refresh, status, error } = await useAsyncData(
  () => `profile-${name.value}`,
  async () => {
    const query = name.value ? `?username=${encodeURIComponent(name.value)}` : '';
    const response = await fetch(`/api/v1/profile${query}`);
    const body = (await response.json().catch(() => ({}))) as ProfileData;
    if (!response.ok || body.details === 'USER_NOT_FOUND') {
      const statusCode = body.details === 'USER_NOT_FOUND' ? 404 : response.status || 500;
      throw createError({ statusCode });
    }
    return body;
  },
  { watch: [name] },
);

watch(
  error,
  (value) => {
    if (value) showError({ statusCode: value.statusCode ?? 500, fatal: true });
  },
  { immediate: true },
);

const user = computed(() => data.value?.user ?? null);
const isSelf = computed(() => !!data.value?.self && data.value.self.id === user.value?.id);
const displayedFaction = computed(() =>
  user.value?.factions.find((faction) => faction.id === user.value?.displayedFactionId),
);
const profileTitle = computed(() => (user.value ? t("{0}'s Profile", [user.value.name]) : ''));

useHead({ title: () => (user.value ? `${user.value.name} - ${config.public.title}` : config.public.title) });

const tabs = computed<TabsItem[]>(() => [
  { label: t('Info'), icon: ICONS.profile, value: 'details', slot: 'details' as const },
  ...(isSelf.value
    ? [
        { label: t('Reports'), icon: ICONS.reports, value: 'reports', slot: 'reports' as const },
        { label: t('Factions'), icon: ICONS.factions, value: 'factions', slot: 'factions' as const },
        { label: t('Data'), icon: ICONS.image, value: 'data', slot: 'data' as const },
      ]
    : []),
]);

const activeTab = computed({
  get: () => {
    const action = String(route.query.action ?? 'details').toLowerCase();
    return tabs.value.some((tab) => tab.value === action) ? action : 'details';
  },
  set: (action: string | number) => {
    void router.replace({ query: { ...route.query, action: String(action) } });
  },
});

/** Shows the outcome of a faction action and reloads the profile. */
async function onActionResult(success: boolean, message: string) {
  toast.add({
    title: message,
    color: success ? 'success' : 'error',
    icon: success ? ICONS.check : ICONS.warning,
  });
  if (success) await refresh();
}
</script>

<template>
  <div class="h-full overflow-y-auto bg-default text-default">
    <SiteNav :self-name="data?.self?.name" :page-title="profileTitle" :page-link="route.path" />

    <main class="mx-auto max-w-5xl px-4 py-6">
      <div v-if="status === 'pending' && !data" class="flex justify-center py-20">
        <UIcon :name="ICONS.loading" class="size-8 animate-spin" />
      </div>

      <template v-else-if="data && user">
        <h1 class="mb-6 text-3xl font-bold text-highlighted">
          <span v-if="displayedFaction" class="text-muted">[{{ displayedFaction.tag }}]</span>
          {{ profileTitle }}
        </h1>

        <UTabs
          v-model="activeTab"
          :items="tabs"
          orientation="vertical"
          variant="link"
          class="flex-col gap-6 md:flex-row"
          :ui="{ list: 'w-full shrink-0 self-start md:w-48', content: 'min-w-0 flex-1' }"
        >
          <template #details>
            <ProfileDetails :data="data" :displayed-faction="displayedFaction" />
          </template>
          <template #reports>
            <ProfileReports :data="data" />
          </template>
          <template #factions>
            <ProfileFactions :data="data" @result="onActionResult" />
          </template>
          <template #data>
            <ProfileLogKeys :keys="data.keys ?? {}" />
          </template>
        </UTabs>
      </template>
    </main>
  </div>
</template>

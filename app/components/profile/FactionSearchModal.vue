<script setup lang="ts">
import type { FactionSearchResult } from '~/types/profile';

const props = defineProps<{ onJoin: (faction: FactionSearchResult) => Promise<void>; close: () => void }>();

const PAGE_SIZE = 50;
const term = ref('');
const results = ref<FactionSearchResult[]>([]);
const searched = ref(false);
const loading = ref(false);
const hasMore = ref(false);
const error = ref('');
let lastQuery = '';

async function search(more = false) {
  const query = term.value.toLowerCase().trim();
  if (!query) return;
  if (!more || query !== lastQuery) {
    results.value = [];
  }
  loading.value = true;
  error.value = '';
  const response = await jsonApi
    .get<FactionSearchResult[]>(`/factions/search?term=${encodeURIComponent(term.value)}&after=${results.value.length}`)
    .catch(() => null);
  loading.value = false;
  lastQuery = query;
  searched.value = true;

  if (response?.success === true && Array.isArray(response.details)) {
    results.value = [...results.value, ...response.details];
    hasMore.value = response.details.length === PAGE_SIZE;
  } else {
    error.value = String(response?.details ?? 'An unknown error occurred. Please try again later.');
  }
}

function join(faction: FactionSearchResult) {
  props.close();
  void props.onJoin(faction);
}
</script>

<template>
  <div class="space-y-4">
    <form class="flex gap-2" @submit.prevent="search()">
      <UInput
        v-model="term"
        :placeholder="$t('Search:')"
        autocomplete="off"
        required
        class="flex-1"
        :disabled="loading"
        autofocus
      />
      <UButton type="submit" :icon="ICONS.search" color="info" variant="outline" :loading="loading" />
    </form>

    <p v-if="error" class="text-sm text-error">{{ error }}</p>
    <p v-else-if="!searched" class="text-center text-muted">{{ $t('Enter a search term to get started.') }}</p>
    <p v-else-if="!results.length && !loading" class="text-center text-muted">No results for this search term.</p>

    <div class="max-h-[60vh] space-y-2 overflow-y-auto">
      <UCard v-for="faction in results" :key="faction.id" :ui="{ body: 'p-3 sm:p-3' }">
        <UCollapsible>
          <div class="flex items-center justify-between gap-2">
            <UButton variant="link" color="neutral" class="min-w-0 px-0 text-left" :trailing-icon="ICONS.collapse">
              <span class="truncate"
                >(ID: {{ faction.id }}) [{{ faction.tag }}] {{ faction.name }}, from {{ faction.owner }}</span
              >
            </UButton>
            <UButton
              :icon="ICONS.join"
              color="success"
              size="xs"
              :disabled="faction.userJoined"
              @click.stop="join(faction)"
            >
              {{ faction.userJoined ? 'Already Joined' : 'Join' }}
            </UButton>
          </div>
          <template #content>
            <table class="mt-2 text-sm [&_td]:text-left [&_th]:pr-3 [&_th]:text-right">
              <tbody>
                <tr>
                  <th>ID</th>
                  <td>{{ faction.id }}</td>
                </tr>
                <tr>
                  <th>Name</th>
                  <td>{{ faction.name }}</td>
                </tr>
                <tr>
                  <th>Tag</th>
                  <td>{{ faction.tag }}</td>
                </tr>
                <tr>
                  <th>Owner</th>
                  <td>
                    <a :href="`/profile/${faction.owner}`" target="_blank" class="text-primary hover:underline">{{
                      faction.owner
                    }}</a>
                  </td>
                </tr>
                <tr>
                  <th>Member Count</th>
                  <td>{{ faction.memberCount || -1 }}</td>
                </tr>
                <tr>
                  <th>Created Date</th>
                  <td>{{ new Date(faction.creation_ms).toString() }}</td>
                </tr>
                <tr>
                  <th>Created Canvas</th>
                  <td>{{ faction.canvasCode }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </UCollapsible>
      </UCard>
    </div>

    <UButton v-if="hasMore" block color="neutral" variant="outline" size="sm" :loading="loading" @click="search(true)">
      {{ $t('Load More') }}
    </UButton>

    <div class="flex justify-end">
      <UButton color="neutral" variant="outline" @click="close">{{ $t('Close') }}</UButton>
    </div>
  </div>
</template>

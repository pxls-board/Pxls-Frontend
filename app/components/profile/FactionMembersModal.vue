<script setup lang="ts">
import type { Faction } from '~/types/profile';

const props = defineProps<{
  faction: Faction;
  selfId?: number;
  onAction: (message: string, request: () => Promise<ApiResult>, successMessage: string) => Promise<void>;
  close: () => void;
}>();

// The owner can't leave without transferring ownership, so they're not listed.
const members = computed(() => props.faction.members.filter((member) => member.id !== props.selfId));

function run(message: string, body: Record<string, unknown>, successMessage: string) {
  props.close();
  void props.onAction(message, () => jsonApi.put(`/factions/${props.faction.id}`, body), successMessage);
}

const transfer = (member: string) =>
  run(
    `Are you sure you want to transfer ownership? You'll have to ask ${member} to transfer back if you change your mind, and they can say no!`,
    { newOwner: member },
    'Faction ownership transfered',
  );
const ban = (member: string) =>
  run(
    `Are you sure you want to ban ${member}?`,
    { user: member, banState: true },
    `${member} has been banned from the faction`,
  );
const unban = (member: string) =>
  run(
    `Are you sure you want to unban ${member}?`,
    { user: member, banState: false },
    `${member} was unbanned from the faction`,
  );
</script>

<template>
  <div class="space-y-4">
    <UCollapsible :default-open="true">
      <UButton color="info" variant="link" class="px-0" :trailing-icon="ICONS.collapse">{{
        $t('Faction Members')
      }}</UButton>
      <template #content>
        <ul v-if="faction.members.length > 1" class="mt-2 divide-y divide-default">
          <li v-for="member in members" :key="member.id" class="flex items-center justify-between gap-2 py-1.5">
            <a :href="`/profile/${member.name}`" target="_blank" class="text-primary hover:underline">{{
              member.name
            }}</a>
            <div class="flex gap-1">
              <UButton :icon="ICONS.transfer" color="success" size="xs" @click="transfer(member.name)">
                {{ $t('Transfer Ownership') }}
              </UButton>
              <!-- translator: bans a user from the faction -->
              <UButton :icon="ICONS.ban" color="error" size="xs" @click="ban(member.name)">{{ $t('Ban') }}</UButton>
            </div>
          </li>
        </ul>
        <p v-else class="mt-2 text-center text-muted">{{ $t('Nothing to see here!') }}</p>
      </template>
    </UCollapsible>

    <UCollapsible>
      <UButton color="info" variant="link" class="px-0" :trailing-icon="ICONS.collapse">{{
        $t('Faction Bans')
      }}</UButton>
      <template #content>
        <ul v-if="faction.bans.length" class="mt-2 divide-y divide-default">
          <li v-for="banned in faction.bans" :key="banned.name" class="flex items-center justify-between gap-2 py-1.5">
            <span>{{ banned.name }}</span>
            <UButton size="xs" @click="unban(banned.name)">{{ $t('Unban') }}</UButton>
          </li>
        </ul>
        <p v-else class="mt-2 text-center text-muted">{{ $t('Nothing to see here!') }}</p>
      </template>
    </UCollapsible>

    <div class="flex justify-end">
      <UButton color="neutral" variant="outline" @click="close">{{ $t('Close') }}</UButton>
    </div>
  </div>
</template>

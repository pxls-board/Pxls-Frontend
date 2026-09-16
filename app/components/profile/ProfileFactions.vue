<script setup lang="ts">
import type { Faction, ProfileData } from '~/types/profile';

const props = defineProps<{ data: ProfileData }>();
const emit = defineEmits<{ result: [success: boolean, message: string] }>();

const modal = useModalStore();
const { t } = useI18n();

const user = computed(() => props.data.user);
const minPixels = computed(() => props.data.newFactionMinPixels ?? 0);
const lacksPixels = computed(() => minPixels.value > (props.data.self?.pixelCountAllTime ?? 0));
const unknownError = 'An unknown error occurred. Please try again later.';

function confirm(message: string) {
  return new Promise<boolean>((resolve) => {
    let answered = false;
    const handle = modal.showComponent(
      defineAsyncComponent(() => import('~/components/modals/ConfirmModal.vue')),
      {
        message,
        onConfirm: () => {
          answered = true;
          resolve(true);
        },
      },
      { title: 'Confirmation' },
    );
    handle.onClose(() => {
      if (!answered) resolve(false);
    });
  });
}

async function act(message: string, request: () => Promise<ApiResult>, successMessage: string) {
  if (!(await confirm(message))) return;
  const result = await request().catch(() => null);
  if (result?.success === true) {
    emit('result', true, successMessage);
  } else {
    emit('result', false, String(result?.details ?? unknownError));
  }
}

const deleteFaction = (faction: Faction) =>
  act(
    'Are you sure you want to delete this faction? This cannot be undone!',
    () => jsonApi.delete(`/factions/${faction.id}`),
    'Faction Deleted',
  );

const setDisplayed = (faction: Faction, displayed: boolean) =>
  act(
    displayed
      ? 'Are you sure you want to set this as your displayed status? It will show up next to your name in chat.'
      : 'Are you sure you want to remove this from your displayed status? It will no longer show up next to your name in chat.',
    () => jsonApi.put(`/factions/${faction.id}`, { displayed }),
    'Displayed faction updated',
  );

const leave = (faction: Faction) =>
  act(
    'Are you sure you want to leave this faction? You will have to find it again in the factions list if you want to rejoin.',
    () => jsonApi.put(`/factions/${faction.id}`, { joinState: false }),
    'Left Faction',
  );

function openForm(faction?: Faction) {
  modal.showComponent(
    defineAsyncComponent(() => import('~/components/profile/FactionFormModal.vue')),
    {
      faction,
      palette: props.data.palette,
      maxName: props.data.maxFactionNameLength,
      maxTag: props.data.maxFactionTagLength,
      onResult: (success: boolean, message: string) => emit('result', success, message),
    },
    { title: `${faction ? 'Edit' : 'Create'} Faction`, escapeClose: false, clickClose: false },
  );
}

function openMembers(faction: Faction) {
  modal.showComponent(
    defineAsyncComponent(() => import('~/components/profile/FactionMembersModal.vue')),
    {
      faction,
      selfId: props.data.self?.id,
      onAction: act,
    },
    { title: t('Members of {0} ([{1}])', [faction.name, faction.tag]) },
  );
}

function openSearch() {
  modal.showComponent(
    defineAsyncComponent(() => import('~/components/profile/FactionSearchModal.vue')),
    {
      onJoin: (faction: { id: number }) =>
        act(
          'Are you sure you want to join this faction?',
          () => jsonApi.put(`/factions/${faction.id}`, { joinState: true }),
          'Faction Joined',
        ),
    },
    { title: t('Find A Faction'), class: 'sm:max-w-4xl' },
  );
}
</script>

<template>
  <div class="space-y-4">
    <p v-if="user.isFactionRestricted" class="text-sm text-error">
      {{
        $t(
          'You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.',
        )
      }}
    </p>
    <p v-else-if="user.isBanned" class="text-sm text-error">
      {{
        $t(
          'You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.',
        )
      }}
    </p>
    <p v-if="lacksPixels" class="text-sm text-warning">
      {{ $t('You must have at least {0} all-time pixels to create a faction.', [minPixels]) }}
    </p>

    <div class="flex gap-2">
      <UButton
        :icon="ICONS.add"
        color="success"
        size="sm"
        :disabled="lacksPixels || user.isFactionRestricted"
        @click="openForm()"
      >
        {{ $t('Create') }}
      </UButton>
      <UButton :icon="ICONS.join" size="sm" @click="openSearch">{{ $t('Join') }}</UButton>
    </div>

    <UCard v-for="faction in user.factions" :key="faction.id">
      <div class="flex gap-4">
        <span class="text-2xl font-bold" :style="{ color: intToHex(faction.color ?? 0) }">[{{ faction.tag }}]</span>
        <div class="min-w-0 flex-1 space-y-2">
          <h5 class="flex items-center gap-1 text-lg font-semibold">
            <UIcon
              v-if="user.displayedFactionId === faction.id"
              :name="ICONS.visible"
              class="text-success"
              :title="$t('This is your currently displayed faction.')"
            />
            <!-- translator: e.g. "Pixelers (members: 100, ID: 1)" -->
            {{ $t('{0} (members: {1}, ID: {2})', [faction.name, faction.members.length, faction.id]) }}
          </h5>
          <p class="text-sm text-muted">{{ $t('Owner: {0}', [faction.ownerName]) }}</p>
          <div class="flex flex-wrap gap-2">
            <!-- translator: stops showing the faction next to the user's name -->
            <UButton
              v-if="user.displayedFactionId === faction.id"
              :icon="ICONS.close"
              color="info"
              size="xs"
              @click="setDisplayed(faction, false)"
            >
              {{ $t('Remove Displayed') }}
            </UButton>
            <!-- translator: shows the faction next to the user's name -->
            <UButton v-else :icon="ICONS.check" color="info" size="xs" @click="setDisplayed(faction, true)">
              {{ $t('Set Displayed') }}
            </UButton>
            <template v-if="faction.ownerId === data.self?.id">
              <UButton :icon="ICONS.factions" color="info" size="xs" @click="openMembers(faction)">
                {{ $t('Members') }}
              </UButton>
              <UButton :icon="ICONS.edit" color="info" size="xs" @click="openForm(faction)">{{ $t('Edit') }}</UButton>
              <UButton :icon="ICONS.delete" color="error" size="xs" @click="deleteFaction(faction)">
                {{ $t('Delete') }}
              </UButton>
            </template>
            <UButton v-else :icon="ICONS.leave" color="error" size="xs" @click="leave(faction)">
              {{ $t('Leave') }}
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <p v-if="!user.factions.length" class="text-center text-warning">{{ $t('You are not in any factions yet!') }}</p>
  </div>
</template>

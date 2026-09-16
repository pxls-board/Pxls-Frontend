<script setup lang="ts">
import type { Faction, ProfileData } from '~/types/profile';

const props = defineProps<{ data: ProfileData; displayedFaction?: Faction }>();

const user = computed(() => props.data.user);
const number = (value: number) => new Intl.NumberFormat().format(value);
const date = (time: number) => new Date(time).toLocaleString();
const iso = (time: number) => new Date(time).toISOString();
</script>

<template>
  <UCard>
    <h3 class="mb-4 text-center text-xl font-semibold">{{ user.username }}</h3>
    <table class="mx-auto text-sm">
      <tbody class="[&_td]:py-1 [&_td]:text-left [&_th]:py-1 [&_th]:pr-4 [&_th]:text-right [&_th]:align-top">
        <tr>
          <th>{{ $t('Registration Date') }}</th>
          <td>
            <time :datetime="iso(user.signupTime)">{{ date(user.signupTime) }}</time>
          </td>
        </tr>
        <template v-if="!data.snipMode">
          <tr>
            <th>{{ $t('Alltime Pixels') }}</th>
            <td>{{ number(user.pixelCountAllTime) }}</td>
          </tr>
          <tr>
            <th>{{ $t('Current Canvas Pixels') }}</th>
            <td>{{ number(user.pixelCount) }}</td>
          </tr>
        </template>
        <tr>
          <th>{{ $t('Discord Tag') }}</th>
          <td>{{ user.discordName || 'Not Set' }}</td>
        </tr>
        <tr>
          <th>{{ $t('Faction') }}</th>
          <td v-if="displayedFaction">
            [{{ displayedFaction.tag }}] {{ displayedFaction.name }} (ID: {{ displayedFaction.id }})
          </td>
          <td v-else class="text-muted">({{ $t('None') }})</td>
        </tr>
        <tr>
          <th>{{ $t('Roles') }}</th>
          <td>
            <ul v-if="user.roles.length" class="space-y-1">
              <li v-for="role in user.roles" :key="role.id" class="flex items-center gap-1">
                <UIcon
                  v-for="(badge, index) in role.badges"
                  :key="index"
                  :name="iconFromFontAwesome(badge.cssIcon ?? '')"
                />
                {{ role.name }}
              </li>
            </ul>
            <span v-else class="text-muted">({{ $t('None') }})</span>
          </td>
        </tr>
        <tr v-if="user.isBanned">
          <th>{{ $t('Canvas Ban Expiry') }}</th>
          <td>
            <template v-if="user.isPermaBanned">{{ $t('Never') }}</template>
            <time v-else :datetime="iso(user.banExpiry)">{{ date(user.banExpiry) }}</time>
          </td>
        </tr>
        <tr v-if="user.isChatBanned">
          <th>{{ $t('Chat Ban Expiry') }}</th>
          <td>
            <template v-if="user.isPermaChatBanned">{{ $t('Never') }}</template>
            <time v-else :datetime="iso(user.chatBanExpiry)">{{ date(user.chatBanExpiry) }}</time>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p
      class="pxls-prose mt-6 text-center"
      v-html="$t('View rankings and other stats <a href=&quot;/stats&quot;>here</a>.')"
    />
  </UCard>
</template>

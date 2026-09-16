<script setup lang="ts">
import type { Faction } from '~/types/profile';

const props = defineProps<{
  faction?: Faction;
  palette?: string;
  maxName?: number;
  maxTag?: number;
  onResult: (success: boolean, message: string) => void;
  close: () => void;
}>();

const name = ref(props.faction?.name ?? '');
const tag = ref(props.faction?.tag ?? '');
const color = ref(props.faction ? intToHex(props.faction.color >> 0) : '#000000');
const busy = ref(false);
const error = ref('');

const swatches = computed(() =>
  (props.palette ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith('#') ? value : `#${value}`)),
);

async function submit() {
  busy.value = true;
  error.value = '';
  const body = { name: name.value, tag: tag.value, color: parseInt(color.value.substring(1), 16) };
  const result = await (
    props.faction ? jsonApi.put(`/factions/${props.faction.id}`, body) : jsonApi.post('/factions', body)
  ).catch(() => null);
  busy.value = false;
  if (result?.success === true) {
    props.onResult(true, `Faction ${props.faction ? 'edit' : 'creat'}ed`);
    props.close();
  } else {
    error.value = String(result?.details ?? 'An unknown error occurred. Please try again later.');
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <h5 class="font-semibold">Faction Details</h5>
    <UFormField
      label="Faction Name:"
      :help="`The name of your faction will be displayed when your tag is hovered in chat. Maximum of ${maxName ?? '∞'} characters.`"
      required
    >
      <UInput
        v-model="name"
        :maxlength="maxName"
        required
        autocomplete="off"
        class="w-full"
        autofocus
        :disabled="busy"
      />
    </UFormField>
    <UFormField
      label="Faction Tag:"
      :help="`Your tag is displayed next to your name in chat. Maximum of ${maxTag ?? '∞'} characters.`"
      required
    >
      <UInput v-model="tag" :maxlength="maxTag" required autocomplete="off" class="w-full" :disabled="busy" />
    </UFormField>
    <UFormField label="Faction Color:" help="Your faction color changes your tag color in chat.">
      <div class="flex flex-wrap items-start gap-4">
        <UColorPicker v-model="color" format="hex" :disabled="busy" />
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="size-8 rounded border border-default" :style="{ backgroundColor: color }" />
            <UInput v-model="color" class="w-28 font-mono" :disabled="busy" />
          </div>
          <div v-if="swatches.length" class="flex max-w-56 flex-wrap gap-1">
            <button
              v-for="swatch in swatches"
              :key="swatch"
              type="button"
              class="size-5 rounded-sm border border-default"
              :style="{ backgroundColor: swatch }"
              :title="swatch"
              @click="color = swatch"
            />
          </div>
        </div>
      </div>
    </UFormField>
    <p v-if="error" class="text-sm text-error">{{ error }}</p>
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" type="button" :disabled="busy" @click="close">Cancel</UButton>
      <UButton type="submit" :loading="busy">{{ busy ? 'Working...' : faction ? 'Update' : 'Create' }}</UButton>
    </div>
  </form>
</template>

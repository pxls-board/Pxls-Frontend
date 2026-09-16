<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const config = useRuntimeConfig();
const selfName = ref<string | null>(null);

const code = computed(() => props.error.statusCode ?? 500);

useHead({ title: () => `${code.value} - ${config.public.title}` });

onMounted(async () => {
  try {
    const response = await fetch('/whoami');
    if (response.ok) {
      selfName.value = ((await response.json()) as { username?: string }).username ?? null;
    }
  } catch {
    // not logged in
  }
});
</script>

<template>
  <UApp>
    <div class="h-full overflow-y-auto bg-default text-default">
      <SiteNav :self-name="selfName" />
      <main class="mx-auto max-w-3xl px-4 py-10">
        <template v-if="code === 404">
          <!-- translator: HTTP status code name -->
          <h1 class="text-3xl font-bold">{{ $t('Not Found') }}</h1>
          <USeparator class="my-4" />
          <p>
            {{
              $t(
                'The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.',
              )
            }}
          </p>
        </template>
        <template v-else-if="code === 401 || code === 403">
          <!-- translator: HTTP status code name -->
          <h1 class="text-3xl font-bold">{{ $t('Not Authenticated') }}</h1>
          <USeparator class="my-4" />
          <p>
            {{
              $t(
                'You must be logged in to access this data. Please go back to pxls and go through the authentication process.',
              )
            }}
          </p>
        </template>
        <template v-else>
          <!-- translator: HTTP status code name -->
          <h1 class="text-3xl font-bold">{{ $t('Not Allowed') }}</h1>
          <USeparator class="my-4" />
          <p>
            {{
              $t(
                'The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.',
              )
            }}
          </p>
        </template>

        <div class="mt-6 flex gap-2">
          <!-- translator: links to the homepage (the app itself) -->
          <UButton :icon="ICONS.back" to="/" external>{{ $t('Back to Pxls') }}</UButton>
          <UButton v-if="code !== 401 && code !== 403" :icon="ICONS.user" to="/profile" external>
            {{ $t('My Profile') }}
          </UButton>
        </div>
      </main>
    </div>
  </UApp>
</template>

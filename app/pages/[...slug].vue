<script setup lang="ts">
// The server falls back to the app when the back end answers a page request
// with an error, passing the status along in a short-lived cookie.
const status = useCookie<number | null>('pxls-error-status');
const statusCode = Number(status.value) || 404;
status.value = null;

throw createError({ statusCode, fatal: true });
</script>

<template>
  <div />
</template>

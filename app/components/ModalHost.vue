<script setup lang="ts">
const modal = useModalStore();

function onOpenChange(id: number, open: boolean) {
  if (!open) modal.close(id);
}
</script>

<template>
  <UModal
    v-for="entry in modal.stack"
    :key="entry.id"
    :open="true"
    :dismissible="entry.options.clickClose || entry.options.escapeClose"
    :close="!entry.options.hideClose"
    :title="typeof entry.title === 'string' ? entry.title : undefined"
    :class="entry.options.class"
    @update:open="onOpenChange(entry.id, $event)"
  >
    <template v-if="entry.title && typeof entry.title !== 'string'" #title>
      <DomNodes :nodes="entry.title" />
    </template>
    <template #body>
      <component
        :is="entry.component"
        v-if="entry.component"
        v-bind="entry.props"
        :close="() => modal.close(entry.id)"
      />
      <DomNodes v-else :nodes="entry.body" tag="div" class="pxls-markdown" />
    </template>
    <template v-if="entry.footer" #footer>
      <DomNodes :nodes="entry.footer" tag="div" class="flex w-full justify-end gap-2" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
const ui = useUiStore();
const modal = useModalStore();
const { t } = useI18n();

const target = ref<HTMLElement | null>(null);

function onDragOver(event: DragEvent) {
  // Needed for `drop` to fire.
  event.preventDefault();
}

function onDragEnter(event: DragEvent) {
  event.preventDefault();
  ui.dragDropVisible = true;
}

function onDragLeave(event: DragEvent) {
  event.preventDefault();
  if (event.target === target.value) ui.dragDropVisible = false;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/**
 * What a drop contains depends on its source:
 * - files from a file manager: the file (name, mime type, contents)
 * - URLs/embedded images (e.g. from Discord) on Windows: a `.url` file whose
 *   base64 contents are `[InternetShortcut]\r\nURL=https://…`
 */
async function onDrop(event: DragEvent) {
  event.preventDefault();
  ui.dragDropVisible = false;
  const data = event.dataTransfer;
  if (!data) return;

  let url: string;
  if (data.types.includes('Files') && data.files[0]) {
    url = await readAsDataUrl(data.files[0]);
    if (url.startsWith('data:application/octet-stream')) {
      const shortcut = atob(url.split(',')[1] ?? '');
      url = shortcut.split('URL=')[1]?.trim() ?? url;
    }
  } else if (data.types.length === 0) {
    // Dragging random text.
    return;
  } else {
    url = data.getData('text/plain');
  }

  if (url.startsWith('file:')) {
    modal.showText(t('Cannot fetch local files. Use the file selector in template settings.'));
    return;
  }

  if (url.startsWith(window.location.origin)) {
    modal.showComponent(
      defineAsyncComponent(() => import('~/components/modals/ConfirmModal.vue')),
      {
        message: t('Are you sure you want to redirect to the following URL?'),
        detail: url,
        dangerous: true,
        onConfirm: () => {
          window.location.href = url;
        },
      },
      { title: t('Redirect Warning') },
    );
    return;
  }

  if (url.startsWith('data:')) {
    const mimeType = url.substring(5, url.indexOf(';'));
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
      modal.showText(t('Drag and dropped file must be a valid image.'));
      return;
    }
  }

  ui.handleFileUrl(url);
}

onMounted(() => {
  document.addEventListener('dragover', onDragOver);
  document.addEventListener('dragenter', onDragEnter);
  document.addEventListener('dragleave', onDragLeave);
  document.addEventListener('drop', onDrop);
});

onBeforeUnmount(() => {
  document.removeEventListener('dragover', onDragOver);
  document.removeEventListener('dragenter', onDragEnter);
  document.removeEventListener('dragleave', onDragLeave);
  document.removeEventListener('drop', onDrop);
});
</script>

<template>
  <div
    v-if="ui.dragDropVisible"
    ref="target"
    class="fixed inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm"
  >
    <div
      class="pointer-events-none flex h-1/2 w-1/2 items-center justify-center rounded-2xl border-4 border-dashed border-white/80 text-2xl font-bold text-white"
    >
      <span>{{ $t('Drag and drop template image') }}</span>
    </div>
    <UButton color="neutral" @click="ui.dragDropVisible = false">{{ $t('Exit') }}</UButton>
  </div>
</template>

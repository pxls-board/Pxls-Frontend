const TEMPLATE_QUERY_KEYS = ['template', 'tw', 'ox', 'oy', 'title', 'convert'];

/** A link to the site at a position, keeping the current template parameters. */
export function getLinkToCoords(x = 0, y = 0, scale: number | string = 20): string {
  const query = useQueryStore();
  const templateConfig = TEMPLATE_QUERY_KEYS.filter((key) => query.has(key))
    .map((key) => `${key}=${encodeURIComponent(query.get(key) ?? '')}`)
    .join('&');
  return `${window.location.origin}/#x=${Math.floor(x)}&y=${Math.floor(y)}&scale=${scale}&${templateConfig}`;
}

/** The board coordinates under the pointer. */
export const useCoordsStore = defineStore('coords', () => {
  const mouse = ref<{ x: number; y: number } | null>(null);
  const copyPulse = ref(false);

  function track(clientX: number, clientY: number) {
    mouse.value = useBoardStore().fromScreen(clientX, clientY);
  }

  function copyCoords(useHash = false) {
    if (!navigator.clipboard) return;
    const query = useQueryStore();
    let link: string;
    if (useHash) {
      link = getLinkToCoords(Number(query.get('x')), Number(query.get('y')), query.get('scale') ?? 20);
    } else {
      if (!mouse.value) return;
      link = getLinkToCoords(mouse.value.x, mouse.value.y, 20);
    }
    void navigator.clipboard.writeText(link);
    copyPulse.value = true;
    setTimeout(() => {
      copyPulse.value = false;
    }, 200);
  }

  return { mouse, copyPulse, track, copyCoords, getLinkToCoords };
});

import type { PxlsNotification } from '~/types/pxls';

/** Site notifications shown in the notifications panel. */
export const useNotificationsStore = defineStore('notifications', () => {
  const socket = useSocket();
  const panels = usePanelsStore();

  const items = shallowRef<PxlsNotification[]>([]);
  const unread = ref(false);

  function checkLatest(id: number) {
    if ((ls.get<number>('notifications.lastSeen') ?? -1) >= id) return;
    if (panels.isOpen('notifications')) {
      ls.set('notifications.lastSeen', id);
    } else {
      unread.value = true;
    }
  }

  async function init() {
    socket.on('notification', ({ notification }) => {
      if (!notification) return;
      items.value = [notification, ...items.value];
      checkLatest(notification.id);
    });

    pxlsEvents.on('panel:opened', (panel) => {
      const latest = items.value[0];
      if (panel === 'notifications' && latest) {
        unread.value = false;
        ls.set('notifications.lastSeen', latest.id);
      }
    });

    try {
      const response = await fetch('/notifications');
      const data = (await response.json()) as PxlsNotification[];
      if (Array.isArray(data) && data.length) {
        items.value = [...items.value, ...data];
        checkLatest(data[0]!.id);
      }
    } catch {
      console.error('Failed to get initial notifications from server');
    }
  }

  return { items, unread, init };
});

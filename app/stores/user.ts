import type { AuthService, PlacementOverrides, Role, WebInfo } from '~/types/pxls';

declare global {
  interface Window {
    initAdmin?: (admin: Record<string, unknown>, callback: (admin: Record<string, unknown>) => void) => void;
    deInitAdmin?: () => void;
  }
}

interface AuthResponse {
  signup: boolean;
  token: string;
}

/** The signed-in user, sign in/up/out, bans and the staff admin script. */
export const useUserStore = defineStore('user', () => {
  const socket = useSocket();

  const loggedIn = ref(false);
  const username = ref('');
  const roles = shallowRef<Role[]>([]);
  const pixelCount = ref<number | null>(null);
  const pixelCountAllTime = ref<number | null>(null);
  const placementOverrides = ref<PlacementOverrides | null>(null);
  const chatNameColor = ref(0);
  const renameRequested = ref(false);
  const loginMethod = ref<string | null>(null);
  const onlineCount = ref<number | null>(null);
  const banned = ref(false);
  const banMessage = ref<string | null>(null);
  const authServices = shallowRef<AuthService[]>([]);
  const legal = shallowRef<WebInfo['legal']>({});
  const pendingSignupToken = ref<string | null>(null);
  const signInPromptOpen = ref(false);
  const admin = shallowRef<Record<string, unknown> | false>(false);
  let instaban = false;

  const permissions = computed(() => {
    const result = new Set<string>();
    const visit = (role: Role) => {
      for (const permission of role.permissions.flat()) result.add(permission);
      role.inherits.forEach(visit);
    };
    roles.value.forEach(visit);
    return [...result];
  });

  const hasPermission = (node: string) => permissions.value.includes(node);
  const isStaff = () => hasPermission('user.admin');
  const isDonator = () => hasPermission('user.donator');
  const showUserInfo = computed(() => loggedIn.value && loginMethod.value !== 'ip');

  function signin() {
    const data = ls.get<AuthResponse>('auth_respond');
    if (!data) return;
    ls.remove('auth_respond');
    if (data.signup) {
      pendingSignupToken.value = data.token;
    } else {
      socket.reconnectSocket();
    }
    signInPromptOpen.value = false;
  }

  /** Opens `/signin/<service>` in a popup, falling back to the same window. */
  function startSignIn(service: AuthService, event?: Event) {
    const url = `/signin/${service.id}?redirect=1`;
    if (window.open(url, '_blank')) {
      event?.preventDefault();
      return;
    }
    ls.set('auth_same_window', true);
    if (!event) window.location.href = url;
  }

  async function doSignup(name: string, discord: string): Promise<string | null> {
    if (!pendingSignupToken.value) return null;
    try {
      await postForm('/signup', { token: pendingSignupToken.value, username: name, discord });
      pendingSignupToken.value = null;
      socket.reconnectSocket();
      return null;
    } catch (error) {
      if (error instanceof HttpError) return readErrorDetails(error.response);
      throw error;
    }
  }

  async function doSignOut() {
    await fetch('/logout');
    window.deInitAdmin?.();
    admin.value = false;
    loggedIn.value = false;
    pixelCount.value = null;
    pixelCountAllTime.value = null;
    pxlsEvents.emit('user:loginState', false);
    socket.reconnectSocket();
  }

  async function execNameChange(newName: string): Promise<string | null> {
    try {
      await postForm('/execNameChange', { newName: newName.trim() });
      renameRequested.value = false;
      return null;
    } catch (error) {
      const { $i18n } = useNuxtApp();
      if (error instanceof HttpError) {
        const details = await readErrorDetails(error.response);
        return details || $i18n.t('An unknown error occurred. Please contact staff on discord');
      }
      return $i18n.t('An unknown error occurred. Please contact staff on discord');
    }
  }

  async function loadAdminScript() {
    window.deInitAdmin?.();
    // The staff script predates this app and relies on jQuery and crel globals.
    const w = window as unknown as Record<string, unknown>;
    if (!w.jQuery) {
      const jquery = (await import('jquery')).default;
      w.$ = w.jQuery = jquery;
    }
    if (!w.crel) {
      w.crel = (await import('crel')).default;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/admin/admin.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });

    window.initAdmin?.(
      {
        socket,
        user: legacyUserApi(),
        modal: useModal(),
        lookup: useLookupStore(),
        chat: useChatStore().legacyApi(),
      },
      (value) => {
        admin.value = markRaw(value);
      },
    );
  }

  function webinit(data: WebInfo) {
    legal.value = data.legal;
    authServices.value = Object.values(data.authServices);
  }

  function wsinit() {
    if (ls.get('auth_proceed')) {
      ls.remove('auth_proceed');
      signin();
    }
  }

  function init(instabanFlag: boolean) {
    instaban = instabanFlag;
    const { $i18n } = useNuxtApp();
    const t = $i18n.t;

    fetch('/users')
      .then((response) => response.json() as Promise<{ count: number }>)
      .then((data) => {
        onlineCount.value = data.count;
        return data;
      })
      .catch((error) => {
        console.error('Error fetching /users: ', error);
        onlineCount.value = NaN;
      });

    window.addEventListener('storage', (event) => {
      if (event.key === 'auth') {
        ls.remove('auth');
        signin();
      }
    });

    socket.on('users', (data) => {
      onlineCount.value = data.count;
    });

    socket.on('userinfo', (data) => {
      username.value = data.username;
      loggedIn.value = true;
      pixelCount.value = data.pixelCount;
      pixelCountAllTime.value = data.pixelCountAllTime;
      placementOverrides.value = data.placementOverrides;
      usePlaceStore().specialColorsVisible = data.placementOverrides.canPlaceAnyColor;
      chatNameColor.value = data.chatNameColor;
      roles.value = data.roles;
      renameRequested.value = data.renameRequested;
      loginMethod.value = data.method;
      useUiStore().discordName = data.discordName ?? '';
      pxlsEvents.emit('user:loginState', true);
      pxlsEvents.emit('userinfo', data);

      let isBanned = false;
      if (data.banExpiry === 0) {
        isBanned = true;
        banMessage.value = t('You are permanently banned.');
      } else if (data.banned === true) {
        isBanned = true;
        const timestamp = new Date(data.banExpiry).toLocaleString();
        banMessage.value = t('You are temporarily banned and will not be allowed to place until ${timestamp}', {
          timestamp,
        });
      } else if (isStaff()) {
        void loadAdminScript();
      } else {
        window.deInitAdmin?.();
      }

      banned.value = isBanned;
      if (isBanned) {
        banMessage.value ??= '';
        useModalStore().showComponent(
          defineAsyncComponent(() => import('~/components/modals/BanModal.vue')),
          { message: banMessage.value, reason: data.banReason },
          { title: t('Banned'), escapeClose: false, clickClose: false, hideClose: true },
        );
        window.deInitAdmin?.();
      }
      useChatStore().updateCanvasBanState(isBanned);

      if (instaban) {
        useBanStore().shadow('App existed beforehand');
      }
      analytics('send', 'event', 'Auth', 'Login', data.method);
    });

    socket.on('pixelCounts', (data) => {
      pixelCount.value = data.pixelCount;
      pixelCountAllTime.value = data.pixelCountAllTime;
      pxlsEvents.emit('pixelCounts:update', { ...data });
    });

    socket.on('admin_placement_overrides', (data) => {
      placementOverrides.value = data.placementOverrides;
    });

    socket.on('rename', (data) => {
      renameRequested.value = data.requested === true;
    });

    socket.on('rename_success', (data) => {
      username.value = data.newName;
    });
  }

  /** The object the admin script and `App.user` expect. */
  function legacyUserApi() {
    return {
      getRoles: () => roles.value,
      isStaff,
      isDonator,
      getPermissions: () => permissions.value,
      hasPermission,
      getUsername: () => username.value,
      getPixelCount: () => pixelCount.value,
      getPixelCountAllTime: () => pixelCountAllTime.value,
      isLoggedIn: () => loggedIn.value,
      getChatNameColor: () => chatNameColor.value,
      setChatNameColor: (color: number) => {
        chatNameColor.value = color;
      },
      get placementOverrides() {
        return placementOverrides.value;
      },
      get admin() {
        return admin.value;
      },
    };
  }

  return {
    loggedIn,
    username,
    roles,
    permissions,
    pixelCount,
    pixelCountAllTime,
    placementOverrides,
    chatNameColor,
    renameRequested,
    onlineCount,
    banned,
    authServices,
    legal,
    pendingSignupToken,
    signInPromptOpen,
    showUserInfo,
    admin,
    init,
    webinit,
    wsinit,
    hasPermission,
    isStaff,
    isDonator,
    startSignIn,
    doSignup,
    doSignOut,
    execNameChange,
    legacyUserApi,
  };
});

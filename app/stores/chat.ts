import mitt from 'mitt';
import type { Badge, ChatBanPacket, ChatPacket, ChatPurge, StrippedFaction, WebInfo } from '~/types/pxls';
import { TH, type TypeaheadDatabase, type TypeaheadEntry, type TypeaheadMatch } from '~/utils/typeahead';

export interface ChatMessageLine {
  kind: 'message';
  key: string;
  id: number;
  author: string;
  date: number;
  badges: Badge[];
  messageRaw: string;
  content: Node[];
  nameColor: number;
  faction: StrippedFaction | null;
  purge: ChatPurge | null;
  shadowBanned: boolean;
  hasPing: boolean;
  isFromUs: boolean;
  reply: ReplyInfo | null;
}

export interface ServerActionLine {
  kind: 'server';
  key: string;
  date: Date;
  text: string;
}

export type ChatLine = ChatMessageLine | ServerActionLine;

/** Snapshot of the message being replied to, used when it's no longer in the list. */
export interface ReplyInfo {
  id: number;
  found: boolean;
  mention: boolean;
  snapshot: Pick<ChatMessageLine, 'author' | 'messageRaw' | 'nameColor' | 'faction' | 'badges' | 'content'> | null;
  purged: boolean;
}

export const TEMPLATE_ACTIONS = {
  ASK: 'ask',
  NEW_TAB: 'new tab',
  CURRENT_TAB: 'current tab',
  JUMP_ONLY: 'jump only',
} as const;

export type ChatAction =
  | 'report'
  | 'mention'
  | 'reply'
  | 'ignore'
  | 'profile'
  | 'chatban'
  | 'purge'
  | 'delete'
  | 'lookup-mod'
  | 'lookup-chat'
  | 'request-rename'
  | 'force-rename';

export type ChatHook = { id: string; get: (packet: ChatPacket) => { pings?: unknown[] } | undefined };

const MAX_INT = 2147483647;

const LINK_REGEX =
  /((?!-))(xn--)?[a-z0-9 ][a-z0-9_ -]{0,61}[a-z0-9 ]{0,1}\.(xn--)?([a-z0-9-]{1,61}|[a-z0-9 -]{1,30}\.[a-z ]{2,})/g;

let serverActionCounter = 0;

export const useChatStore = defineStore('chat', () => {
  const socket = useSocket();
  const settings = useSettings();
  const panels = usePanelsStore();
  const modal = useModalStore();
  const serviceWorker = useServiceWorker();

  const lines = shallowRef<ChatLine[]>([]);
  const ignored = ref<string[]>([]);
  const pingsList = shallowRef<ChatMessageLine[]>([]);
  const pings = ref(0);
  const triggerHasPing = ref(false);
  const iconHasNotification = ref(false);
  const stickToBottom = ref(true);
  const input = ref('');
  const replyTarget = ref<number | null>(null);
  const replyMention = ref(true);
  const hint = ref<{ message: string; error: boolean } | null>(null);
  const rateLimitText = ref('');
  const inputDisabled = ref(true);
  const overlayVisible = ref(true);
  const emojiButtonVisible = ref(false);
  const charLimit = ref<number | undefined>(undefined);
  const enabled = ref(settings.chat.enable.get());
  const highlightedId = ref<number | null>(null);
  const customEmoji = shallowRef<{ name: string; emoji: string }[]>([]);

  const typeahead = reactive({
    helper: null as InstanceType<typeof TH.Typeahead> | null,
    suggesting: false,
    results: [] as TypeaheadEntry[],
    match: null as TypeaheadMatch | null,
    database: null as TypeaheadDatabase | null,
    highlightedIndex: 0,
    lastLength: -1 as number,
    get hasResults() {
      return this.results.length > 0;
    },
    get shouldInsert() {
      return this.suggesting && this.results.length > 0 && this.highlightedIndex !== -1;
    },
  });

  let hooks: ChatHook[] = [];
  let seenHistory = false;
  let idLog: number[] = [];
  let lastPingAudioTimestamp = 0;
  let linkMinimumPixelCount = 0;
  let sendLinkToStaff = false;
  let defaultExternalLinkPopup = false;
  let canvasBanRespected = false;
  let canvasBanned = false;
  let ratelimitMessage = 'Please wait ';
  let markdownProcessor: MarkdownProcessor | null = null;
  const lastOpenedPanel = (ls.get<number>('chat.last_opened_panel') ?? 0) >> 0;
  const pingAudio = new Audio('/chatnotify.wav');
  const timeout = { ends: 0, timer: 0 as ReturnType<typeof setInterval> | 0 };
  const chatban = {
    banned: false,
    banEnd: 0,
    permanent: false,
    banEndFormatted: '',
    timer: 0 as ReturnType<typeof setInterval> | 0,
  };

  const messagesById = computed(() => {
    const map = new Map<number, ChatMessageLine>();
    for (const line of lines.value) {
      if (line.kind === 'message') map.set(line.id, line);
    }
    return map;
  });

  const i18n = () => useNuxtApp().$i18n;
  const board = () => useBoardStore();
  const user = () => useUserStore();

  // ---- Lines -------------------------------------------------------------

  function appendLine(line: ChatLine) {
    let next = [...lines.value, line];
    const max = settings.chat.truncate.max.get();
    const overflow = next.length - max;
    if (overflow > 1) {
      next = next.slice(overflow);
    }
    lines.value = next;
  }

  /** Replaces a message with a modified copy so the list re-renders it. */
  function updateMessages(
    predicate: (line: ChatMessageLine) => boolean,
    patch: (line: ChatMessageLine) => Partial<ChatMessageLine>,
  ) {
    let changed = false;
    const next = lines.value.map((line) => {
      if (line.kind !== 'message' || !predicate(line)) return line;
      changed = true;
      return { ...line, ...patch(line) };
    });
    if (changed) lines.value = next;
  }

  function addServerAction(text: string) {
    appendLine({ kind: 'server', key: `server-${serverActionCounter++}`, date: new Date(), text });
  }

  function processMessage(raw: string, mentionCallback?: (username: string) => void): Node[] {
    if (!markdownProcessor) {
      return [document.createTextNode(raw)];
    }
    try {
      const processor = markdownProcessor().use(window.pxlsMarkdown.plugins.mention, { mentionCallback });
      return renderMarkdown(processor, raw);
    } catch (error) {
      console.error(`could not process chat message "${raw}"`, error, '\nDefaulting to raw content.');
      return [document.createTextNode(raw)];
    }
  }

  function processPacket(packet: ChatPacket, isHistory = false) {
    if (packet.id) {
      if (idLog.includes(packet.id)) return;
      idLog = [packet.id, ...idLog].slice(0, 50);
    }

    const snip = board().snipMode;
    const me = user();
    const hookData = hooks.map((hook) => ({ pings: [] as unknown[], ...hook.get(packet) }));

    if (!snip) {
      addTypeaheadUser(packet.author);
    }

    let hasPing =
      !snip && settings.chat.pings.enable.get() && me.loggedIn && hookData.some((data) => data.pings.length > 0);

    const content = markRaw(
      processMessage(packet.message_raw, (username) => {
        if (username === me.username) hasPing = true;
      }),
    );

    let reply: ReplyInfo | null = null;
    if (packet.replyingToId) {
      const target = messagesById.value.get(packet.replyingToId);
      if (target) {
        if (target.author === me.username && packet.replyShouldMention) hasPing = true;
        reply = {
          id: target.id,
          found: true,
          mention: packet.replyShouldMention,
          purged: target.purge !== null,
          snapshot: {
            author: target.author,
            messageRaw: target.messageRaw,
            nameColor: target.nameColor,
            faction: target.faction,
            badges: target.badges,
            content: markRaw(target.content.map((node) => node.cloneNode(true))),
          },
        };
      } else {
        reply = { id: packet.replyingToId, found: false, mention: false, purged: false, snapshot: null };
      }
    }

    const line: ChatMessageLine = {
      kind: 'message',
      key: `message-${packet.id}`,
      id: packet.id,
      author: packet.author,
      date: packet.date,
      badges: packet.badges ?? [],
      messageRaw: packet.message_raw,
      content,
      nameColor: packet.authorNameColor,
      faction: snip ? null : (packet.strippedFaction ?? null),
      purge: packet.purge ?? null,
      shadowBanned: packet.authorWasShadowBanned === true,
      hasPing,
      isFromUs: packet.author.toLowerCase().trim() === me.username.toLowerCase().trim(),
      reply,
    };
    appendLine(line);

    const isIgnored = !snip && ignored.value.includes(packet.author);
    if (hasPing && !isIgnored && !packet.purge) {
      pingsList.value = [...pingsList.value, line];
      if (!((panels.isOpen('chat') && stickToBottom.value) || packet.date < lastOpenedPanel)) {
        pings.value++;
        if (settings.ui.chat.icon.badge.get() === 'ping') triggerHasPing.value = true;
        if (settings.ui.chat.icon.color.get() === 'ping') iconHasNotification.value = true;
      }

      const audioWhen = settings.chat.pings.audio.when.get();
      const canPlay =
        !isHistory && settings.audio.enable.get() && audioWhen !== 'off' && Date.now() - lastPingAudioTimestamp > 5000;
      if (
        (!panels.isOpen('chat') || !document.hasFocus() || audioWhen === 'always') &&
        useUiStore().tabHasFocus() &&
        canPlay
      ) {
        pingAudio.volume = settings.chat.pings.audio.volume.get();
        void pingAudio.play().catch(() => {});
        lastPingAudioTimestamp = Date.now();
      }
    }

    pxlsEvents.emit('chat', packet);
  }

  // ---- Purges --------------------------------------------------------------

  function markRepliesPurged(ids: Set<number>) {
    updateMessages(
      (line) => line.reply !== null && ids.has(line.reply.id),
      (line) => ({ reply: { ...line.reply!, purged: true } }),
    );
  }

  function purgeLines(targets: ChatMessageLine[], purge: ChatPurge) {
    if (!targets.length) return;
    const ids = new Set(targets.map((line) => line.id));

    if (user().hasPermission('chat.history.purged')) {
      updateMessages(
        (line) => ids.has(line.id),
        () => ({ purge }),
      );
    } else {
      lines.value = lines.value.filter((line) => line.kind !== 'message' || !ids.has(line.id));
      pingsList.value = pingsList.value.filter((line) => !ids.has(line.id));
    }
    markRepliesPurged(ids);
  }

  // ---- Chat bans and cooldowns ---------------------------------------------

  function canChat() {
    if (!user().loggedIn) return false;
    if (!canvasBanRespected) return !chatban.banned;
    return !chatban.banned && !canvasBanned;
  }

  function setChatVisualState(allowed: boolean) {
    inputDisabled.value = !allowed;
    overlayVisible.value = !allowed;
    emojiButtonVisible.value = allowed;
    if (allowed) rateLimitText.value = '';
  }

  function isChatBanned() {
    return chatban.permanent || chatban.banEnd - Date.now() > 0;
  }

  function updateInputLoginState(isLoggedIn: boolean) {
    const banned = isChatBanned();
    if (isLoggedIn && !banned) {
      setChatVisualState(true);
    } else {
      setChatVisualState(false);
      if (!banned) rateLimitText.value = i18n().t('You must be logged in to chat.');
    }
  }

  function updateCanvasBanState(state: boolean) {
    canvasBanned = state;
    const allowed = canChat();
    setChatVisualState(allowed);
    if (!allowed && rateLimitText.value.trim().length === 0) {
      rateLimitText.value = i18n().t('You cannot use chat while canvas banned.');
    }
  }

  function handleChatban(packet: ChatBanPacket) {
    if (timeout.timer) clearInterval(timeout.timer);
    const banStart = Date.now();
    chatban.banEnd = packet.expiry;
    chatban.permanent = packet.permanent;
    chatban.banEndFormatted = formatDate(packet.expiry, 'MMM Do YYYY, hh:mm:ss A');

    setTimeout(() => {
      if (chatban.timer) clearInterval(chatban.timer);
      inputDisabled.value = true;
      emojiButtonVisible.value = false;

      if (packet.expiry - banStart > 0 && !packet.permanent) {
        chatban.banned = true;
        rateLimitText.value = 'You have been banned from chat.';
        addServerAction(`You are banned from chat until ${chatban.banEndFormatted}`);
        if (packet.reason) addServerAction(`Ban reason: ${packet.reason}`);
        chatban.timer = setInterval(() => {
          const timeLeft = chatban.banEnd - Date.now();
          if (timeLeft > 0) {
            overlayVisible.value = true;
            rateLimitText.value = `Chatban expires in ${Math.ceil(timeLeft / 1e3)}s, at ${chatban.banEndFormatted}`;
          } else {
            clearInterval(chatban.timer);
            chatban.timer = 0;
            chatban.banned = false;
            setChatVisualState(canChat());
          }
        }, 150);
      } else if (packet.permanent) {
        chatban.banned = true;
        rateLimitText.value = 'You have been banned from chat.';
        addServerAction('You are banned from chat permanently.');
        if (packet.reason) addServerAction(`Ban reason: ${packet.reason}`);
      } else if (packet.type !== 'chat_ban_state') {
        // chat_ban_state is a query result, not an action notice.
        addServerAction('You have been unbanned from chat.');
        rateLimitText.value = 'You cannot use chat while canvas banned.';
        chatban.banned = false;
      }
      setChatVisualState(canChat());
    }, 0);
  }

  function handleMessageCooldown(diff: number, message: string) {
    timeout.ends = Date.now() + (diff >> 0) * 1e3 + 1e3;
    if (useUiStore().tabHasFocus()) {
      input.value = message;
    }
    overlayVisible.value = Date.now() <= timeout.ends;
    if (timeout.timer) clearInterval(timeout.timer);

    const showCooldown = () => {
      const delta = ((timeout.ends - Date.now()) / 1e3) >> 0;
      rateLimitText.value = ratelimitMessage + humanizeDuration(delta);
      if (delta <= 0) {
        overlayVisible.value = false;
        rateLimitText.value = '';
        clearInterval(timeout.timer);
        timeout.timer = 0;
      }
    };
    timeout.timer = setInterval(showCooldown, 1000);
    showCooldown();
  }

  // ---- Sending ------------------------------------------------------------

  const userCanPostLink = (message: string) => {
    const links = message.match(LINK_REGEX);
    return !(links && links.length && (user().pixelCountAllTime ?? 0) < linkMinimumPixelCount);
  };

  /** Validates the input and updates the hint; returns whether sending is allowed. */
  function checkInput(): boolean {
    const trimmed = input.value.trim();
    let decoded = trimmed;
    try {
      decoded = decodeURIComponent(trimmed);
    } catch {
      // malformed; check the raw text
    }

    const t = i18n().t;
    if (decoded.includes('data:image')) {
      hint.value = { message: t('Please upload your template image to a third-party image host.'), error: true };
      return false;
    }
    if (!userCanPostLink(trimmed)) {
      hint.value = {
        message: t('You must have at least ') + linkMinimumPixelCount + t(' pixels to send links.'),
        error: true,
      };
      return sendLinkToStaff;
    }
    hint.value = null;
    return true;
  }

  function send() {
    const trimmed = input.value.trim();
    if (!checkInput() || trimmed.length === 0 || timeout.timer || typeahead.shouldInsert) {
      return;
    }
    const replyingToId = replyTarget.value ?? 0;
    const replyShouldMention = replyMention.value;
    if (userCanPostLink(trimmed)) {
      cancelReply();
      typeahead.lastLength = -1;
      input.value = '';
    }
    socket.send({ type: 'ChatMessage', message: trimmed, replyingToId, replyShouldMention });
  }

  function startReply(id: number, toggleMentionFirst = false) {
    cancelReply();
    if (toggleMentionFirst) replyMention.value = !replyMention.value;
    replyTarget.value = id;
    chatEvents.emit('focusInput');
    if (stickToBottom.value) chatEvents.emit('scrollToBottom');
  }

  function cancelReply() {
    if (replyTarget.value === null) return;
    replyTarget.value = null;
    replyMention.value = true;
  }

  function appendToInput(text: string) {
    input.value += text;
    chatEvents.emit('focusInput');
  }

  // ---- Typeahead ------------------------------------------------------------

  function addTypeaheadUser(name: string) {
    typeahead.helper?.getDatabase('users')?.addEntry(name, name);
  }

  function initTypeahead() {
    const dbEmoji = new TH.Database(
      'emoji',
      {},
      false,
      false,
      (entry) => (twemoji.test(entry.value) ? entry.value : `:${entry.key}:`),
      (entry) => entry.key,
    );
    const dbUsers = new TH.Database(
      'users',
      {},
      false,
      false,
      (entry) => `@${entry.value} `,
      (entry) => `@${entry.value}`,
    );

    Object.keys(window.emojiDB)
      .sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()))
      .forEach((name) => dbEmoji.addEntry(name, window.emojiDB[name]!));
    for (const emoji of customEmoji.value) {
      window.emojiDB[emoji.name.toLowerCase()] = emoji.emoji;
      dbEmoji.addEntry(emoji.name, emoji.emoji);
    }

    typeahead.helper = markRaw(
      new TH.Typeahead(
        [new TH.Trigger(':', 'emoji', true, 2), new TH.Trigger('@', 'users', false)],
        [' '],
        [dbEmoji, dbUsers],
      ),
    );
    (window as unknown as { th: unknown }).th = typeahead.helper;
  }

  function scanTypeahead(caret: number) {
    const helper = typeahead.helper;
    if (!helper) return;
    const match = helper.scan(caret, input.value);
    typeahead.lastLength = input.value.length;
    typeahead.suggesting = match !== false;
    typeahead.highlightedIndex = 0;
    if (match) {
      typeahead.match = markRaw(match);
      typeahead.database = markRaw(helper.getDatabase(match.trigger.dbType)!);
      typeahead.results = helper.suggestions(match).slice(0, 50);
    } else {
      typeahead.match = null;
      typeahead.results = [];
    }
  }

  function selectTypeahead(direction: 1 | -1) {
    const count = typeahead.results.length;
    if (!count) return;
    let next = typeahead.highlightedIndex + direction;
    if (next < 0) next = count - 1;
    if (next >= count) next = 0;
    typeahead.highlightedIndex = next;
  }

  function insertTypeahead(index = typeahead.highlightedIndex) {
    const entry = typeahead.results[index];
    const match = typeahead.match;
    const database = typeahead.database;
    if (!entry || !match || !database || match.start >= match.end) return;
    const insert = database.inserter(entry);
    input.value = input.value.substring(0, match.start) + insert + input.value.substring(match.end);
    resetTypeahead();
    chatEvents.emit('focusInput');
  }

  function resetTypeahead() {
    typeahead.suggesting = false;
    typeahead.results = [];
    typeahead.highlightedIndex = 0;
    typeahead.match = null;
  }

  // ---- Ignores ----------------------------------------------------------------

  function reloadIgnores() {
    ignored.value = (ls.get<string>('chat.ignored') ?? '').split(',').filter(Boolean);
  }

  function saveIgnores() {
    ls.set('chat.ignored', ignored.value.join(','));
  }

  function addIgnore(name: string) {
    if (name.toLowerCase().trim() !== user().username.toLowerCase().trim() && !ignored.value.includes(name)) {
      ignored.value = [...ignored.value, name];
      saveIgnores();
      // Side effect: pings from ignored users only come back after a refresh.
      pingsList.value = pingsList.value.filter((line) => line.author !== name);
      pxlsEvents.emit('chat:userIgnored', name);
      return true;
    }
    return false;
  }

  function removeIgnore(name: string): string | false {
    if (!ignored.value.includes(name)) return false;
    ignored.value = ignored.value.filter((entry) => entry !== name);
    saveIgnores();
    pxlsEvents.emit('chat:userUnignored', name);
    return name;
  }

  // ---- Pings / unread ------------------------------------------------------

  function clearPings() {
    iconHasNotification.value = false;
    triggerHasPing.value = false;
    pings.value = 0;
  }

  function markLastSeen() {
    const last = [...lines.value].reverse().find((line) => line.kind === 'message');
    if (last && last.kind === 'message') {
      ls.set('chat-last_seen_id', last.id);
    }
  }

  function scrollToMessage(id: number) {
    highlightedId.value = id;
    chatEvents.emit('scrollTo', id);
    setTimeout(() => {
      if (highlightedId.value === id) highlightedId.value = null;
    }, 1000);
  }

  // ---- Links ------------------------------------------------------------------

  function jump(x: number, y: number, zoom?: number) {
    board().centerOn(x, y);
    if (zoom && !Number.isNaN(zoom)) {
      board().setScale(zoom, true);
    }
  }

  function makeLinkElement(href: string): HTMLAnchorElement {
    const anchor = document.createElement('a');
    anchor.className = 'link';
    anchor.href = href;
    anchor.textContent = href;
    anchor.addEventListener('click', async (event) => {
      if (event.shiftKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const isLocal = new URL(href).origin === window.location.origin;
      const skipCheck = !defaultExternalLinkPopup || settings.chat.links.external.skip.get();
      if (skipCheck || isLocal) {
        window.open(href, '_blank');
        return;
      }
      const confirmed = await confirmModal<boolean>(
        () => import('~/components/modals/ExternalLinkModal.vue'),
        { href },
        i18n().t('External Link'),
      );
      if (confirmed) window.open(href, '_blank');
    });
    return anchor;
  }

  function makeCoordinatesElement(
    raw: string,
    x: number,
    y: number,
    scale?: number,
    template?: string | null,
    title?: string | null,
  ): HTMLAnchorElement {
    let text = `(${x}, ${y}${scale != null ? `, ${scale}x` : ''})`;
    if (template != null && template.length >= 11) {
      let templateName = !settings.chat.links.templates.preferurls.get() && title && title.trim() ? title : template;
      try {
        templateName = decodeURIComponent(templateName);
      } catch {
        // keep the encoded name
      }
      if (templateName.length > 25) {
        templateName = `${templateName.substring(0, 22)}...`;
      }
      text += ` (${i18n().t('template:')} ${templateName})`;
    }

    const anchor = document.createElement('a');
    anchor.className = 'link coordinates';
    anchor.href = raw;
    anchor.textContent = text;
    anchor.addEventListener('click', async (event) => {
      if (event.shiftKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (!template) {
        jump(x, y, scale);
        return;
      }
      let action: string | false = settings.chat.links.internal.behavior.get();
      if (action === TEMPLATE_ACTIONS.ASK) {
        action = await confirmModal<string | false>(
          () => import('~/components/modals/TemplateLinkModal.vue'),
          {},
          i18n().t('Open Template'),
        );
      }
      handleTemplateLinkAction(action, raw, x, y, scale);
    });
    return anchor;
  }

  function pushHistoryState() {
    window.history.pushState(null, document.title, document.location.href);
  }

  function handleTemplateLinkAction(action: string | false, raw: string, x: number, y: number, scale?: number) {
    switch (action) {
      case TEMPLATE_ACTIONS.CURRENT_TAB:
        pushHistoryState();
        // Assigning the URL triggers the hash-based template update.
        document.location.href = raw;
        break;
      case TEMPLATE_ACTIONS.JUMP_ONLY:
        pushHistoryState();
        jump(x, y, scale);
        break;
      case TEMPLATE_ACTIONS.NEW_TAB:
        openInNewTab(raw);
        break;
    }
  }

  function openInNewTab(url: string) {
    if (!window.open(url, '_blank')) {
      modal.showComponent(
        defineAsyncComponent(() => import('~/components/modals/OpenFailedModal.vue')),
        { url },
        { title: i18n().t('Open Failed') },
      );
    }
  }

  /** Shows a modal component that resolves via its `resolve` prop. */
  function confirmModal<T>(loader: () => Promise<{ default: unknown }>, props: Record<string, unknown>, title: string) {
    return new Promise<T | false>((resolve) => {
      let settled = false;
      const handle = modal.showComponent(
        defineAsyncComponent(loader as () => Promise<{ default: object }>),
        {
          ...props,
          resolve: (value: T | false) => {
            settled = true;
            handle.close();
            resolve(value);
          },
        },
        { title },
      );
      handle.onClose(() => {
        if (!settled) resolve(false);
      });
    });
  }

  // ---- Actions (user popup, admin script) ----------------------------------

  function handleAction(action: ChatAction, target: { id?: number; username?: string }, event?: MouseEvent) {
    const line = target.id != null ? messagesById.value.get(target.id) : undefined;
    const username = line?.author ?? target.username;
    const messageText = line ? nodesToText(line.content) : '';
    const t = i18n().t;
    const snip = board().snipMode;
    chatEvents.emit('closePopups');

    const show = (loader: () => Promise<{ default: object }>, props: Record<string, unknown>, title: string) =>
      modal.showComponent(defineAsyncComponent(loader), props, { title });

    switch (action) {
      case 'report':
        if (target.id != null) {
          show(
            () => import('~/components/modals/ChatReportModal.vue'),
            { id: target.id, author: username, message: messageText },
            t('Report User'),
          );
        }
        break;
      case 'mention':
        if (username) appendToInput(`@${username} `);
        break;
      case 'reply':
        if (line) startReply(line.id, event?.shiftKey === true);
        break;
      case 'ignore':
        if (username) {
          modal.showText(
            addIgnore(username)
              ? t('User ignored. You can unignore from chat settings.')
              : t(
                  "Failed to ignore user. Either they're already ignored, or an error occurred. If the problem persists, contact a developer.",
                ),
          );
        }
        break;
      case 'profile':
        if (username) openInNewTab(`/profile/${username}`);
        break;
      case 'chatban':
        show(
          () => import('~/components/modals/ChatbanModal.vue'),
          { id: line?.id, username, message: messageText },
          t('Chatban'),
        );
        break;
      case 'purge':
        show(
          () => import('~/components/modals/PurgeUserModal.vue'),
          { id: line?.id, username, message: messageText },
          t('Purge User'),
        );
        break;
      case 'delete':
        if (target.id == null) break;
        if (event?.shiftKey) {
          void postForm('/admin/delete', { cmid: target.id, reason: '', silent: false }).catch(() =>
            modal.showText(t('Failed to delete')),
          );
        } else {
          show(
            () => import('~/components/modals/DeleteMessageModal.vue'),
            { id: target.id, username, message: messageText },
            t('Delete Message'),
          );
        }
        break;
      case 'lookup-mod': {
        const admin = user().admin as { checkUser?: { check?: (arg: unknown, type: string) => void } } | false;
        admin && admin.checkUser?.check?.(snip ? target.id : username, snip ? 'cmid' : 'username');
        break;
      }
      case 'lookup-chat':
        socket.send({ type: 'ChatLookup', arg: snip ? target.id : username, mode: snip ? 'cmid' : 'username' });
        break;
      case 'request-rename':
        show(() => import('~/components/modals/RequestRenameModal.vue'), { username }, 'Request Rename');
        break;
      case 'force-rename':
        show(() => import('~/components/modals/ForceRenameModal.vue'), { username }, t('Force Rename'));
        break;
    }
  }

  function legacyApi() {
    return {
      _handleActionClick(this: HTMLElement, event: MouseEvent) {
        const data = this.dataset;
        handleAction(
          String(data.action).toLowerCase().trim() as ChatAction,
          { id: data.id ? Number(data.id) : undefined, username: data.target },
          event,
        );
      },
      clearPings,
      setCharLimit: (value: number) => {
        charLimit.value = value;
      },
      processMessage,
      saveIgnores,
      reloadIgnores,
      addIgnore,
      removeIgnore,
      getIgnores: () => [...ignored.value],
      typeahead,
      updateSelectedNameColor: (color: number) => {
        user().chatNameColor = color;
      },
      updateCanvasBanState,
      registerHook,
      replaceHook,
      unregisterHook,
      get markdownProcessor() {
        return markdownProcessor;
      },
      get canvasBanRespected() {
        return canvasBanRespected;
      },
    };
  }

  // ---- Hooks ----------------------------------------------------------------

  function registerHook(...newHooks: Partial<ChatHook>[]) {
    hooks.push(...newHooks.map((hook) => ({ id: hook.id || 'hook', get: hook.get || (() => undefined) })));
    return hooks.length;
  }

  function replaceHook(hookId: string, newHook: Partial<ChatHook>) {
    const { id: _ignored, ...rest } = newHook;
    const hook = hooks.find((entry) => entry.id === hookId);
    if (hook) Object.assign(hook, rest);
  }

  function unregisterHook(hookId: string) {
    hooks = hooks.filter((hook) => hook.id !== hookId);
  }

  // ---- Setup -----------------------------------------------------------------

  async function init7TV(emoteSetId: string) {
    try {
      const response = await fetch(`https://7tv.io/v3/emote-sets/${emoteSetId}`, { cache: 'no-store' });
      const set = (await response.json()) as { emotes?: { name: string; data: { host: { url: string } } }[] };
      return (set.emotes ?? []).map((emote) => ({ name: emote.name, emoji: `https:${emote.data.host.url}/2x.webp` }));
    } catch (error) {
      console.error('Failed to fetch 7TV emote set', emoteSetId, error);
      return [];
    }
  }

  async function loadHistory() {
    const response = await fetch('/chat/history');
    const history = (await response.json()) as ChatPacket[];
    if (seenHistory) return;
    for (const packet of history.reverse()) {
      processPacket(packet, true);
    }
    const last = [...lines.value].reverse().find((line) => line.kind === 'message');
    if (last && last.kind === 'message') {
      chatEvents.emit('scrollToBottom');
      if (last.id > (ls.get<number>('chat-last_seen_id') ?? 0)) {
        if (settings.ui.chat.icon.badge.get() === 'message') triggerHasPing.value = true;
        if (settings.ui.chat.icon.color.get() === 'message') iconHasNotification.value = true;
      }
    }
    seenHistory = true;
    addServerAction(`History loaded at ${formatDate(new Date(), 'MMM Do YYYY, hh:mm:ss A')}`);
    setTimeout(() => socket.send({ type: 'ChatbanState' }), 0);
  }

  function init() {
    if (!enabled.value) {
      panels.setEnabled('chat', false);
      return;
    }

    // Left unfrozen on purpose so third-party scripts can extend it.
    markdownProcessor = makeMarkdownProcessor().use(function (this: MarkdownProcessor) {
      this.Compiler.prototype.visitors.link = (node) => {
        const url = new URL(node.url, window.location.href);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const getParam = (name: string) => (hashParams.has(name) ? hashParams.get(name) : url.searchParams.get(name));
        const x = parseFloat(getParam('x') ?? '');
        const y = parseFloat(getParam('y') ?? '');
        if (
          window.location.origin === url.origin &&
          !Number.isNaN(x) &&
          !Number.isNaN(y) &&
          board().validateCoordinates(x, y)
        ) {
          const scale = parseFloat(getParam('scale') ?? '');
          return makeCoordinatesElement(
            url.toString(),
            x,
            y,
            Number.isNaN(scale) ? 20 : scale,
            getParam('template'),
            getParam('title'),
          );
        }
        return makeLinkElement(node.url);
      };
      this.Compiler.prototype.visitors.coordinate = (node) =>
        makeCoordinatesElement(node.url, node.x, node.y, node.scale);
    });

    reloadIgnores();

    socket.on('chat_user_update', (event) => {
      if (!event.who || typeof event.updates !== 'object') {
        console.warn('Malformed chat_user_update: %o', event);
        return;
      }
      for (const [key, value] of Object.entries(event.updates)) {
        switch (key) {
          case 'NameColor':
            updateMessages(
              (line) => line.author === event.who,
              () => ({ nameColor: Math.floor(value as number) }),
            );
            break;
          case 'DisplayedFaction':
            updateMessages(
              (line) => line.author === event.who,
              () => ({ faction: (value as StrippedFaction | null) ?? null }),
            );
            break;
          default:
            console.warn('Got an unknown chat_user_update from %o: %o (%o)', event.who, key, event);
        }
      }
    });

    socket.on('faction_update', ({ faction }) => {
      if (faction?.id == null) return;
      updateMessages(
        (line) => line.faction?.id === faction.id,
        () => ({ faction }),
      );
    });

    socket.on('faction_clear', ({ fid }) => {
      if (fid == null) return;
      updateMessages(
        (line) => line.faction?.id === fid,
        () => ({ faction: null }),
      );
    });

    socket.on('chat_message', ({ message }) => {
      processPacket(message);
      const isOpen = panels.isOpen('chat');
      const authorIgnored = ignored.value.includes(message.author);
      if (!isOpen && !authorIgnored) {
        if (settings.ui.chat.icon.badge.get() === 'message') triggerHasPing.value = true;
        if (settings.ui.chat.icon.color.get() === 'message') iconHasNotification.value = true;
      }
      if (stickToBottom.value) {
        if (isOpen && useUiStore().tabHasFocus()) {
          ls.set('chat-last_seen_id', message.id);
        }
        chatEvents.emit('scrollToBottom');
      }
    });

    serviceWorker.addMessageListener('focus', ({ data }) => {
      if (useUiStore().tabId === data.id && panels.isOpen('chat')) {
        markLastSeen();
      }
    });

    socket.on('message_cooldown', (event) => handleMessageCooldown(event.diff, event.message));

    socket.on('chat_message_blocked', (event) => {
      // When links go to staff, showing the block would give that away.
      if (!sendLinkToStaff) addServerAction(event.message);
    });

    socket.on('chat_lookup', (event) => {
      if (event.target && Array.isArray(event.history) && Array.isArray(event.chatbans)) {
        modal.showComponent(
          defineAsyncComponent(() => import('~/components/modals/ChatLookupModal.vue')),
          { lookup: event },
          { title: 'Chat Lookup', class: 'sm:max-w-4xl' },
        );
      }
    });

    socket.on('chat_ban', handleChatban);
    socket.on('chat_ban_state', handleChatban);

    socket.on('chat_purge', (event) => {
      const purge = { initiator: event.initiator, reason: event.reason ?? '' };
      const targets = lines.value
        .filter(
          (line): line is ChatMessageLine => line.kind === 'message' && line.author === event.target && !line.purge,
        )
        .sort((a, b) => a.date - b.date)
        .slice(-event.amount);
      purgeLines(targets, purge);
      if (event.announce) {
        if (event.amount >= MAX_INT) {
          addServerAction(`${event.initiator} purged all messages from ${event.target}.`);
        } else {
          const plural = event.amount !== 1;
          addServerAction(
            `${event.amount} message${plural ? 's' : ''} from ${event.target} ${plural ? 'were' : 'was'} purged by ${event.initiator}.`,
          );
        }
      }
    });

    socket.on('chat_purge_specific', (event) => {
      const ids = new Set(event.IDs ?? []);
      const targets = lines.value.filter(
        (line): line is ChatMessageLine => line.kind === 'message' && ids.has(line.id),
      );
      if (!targets.length) return;
      purgeLines(targets, { initiator: event.initiator, reason: event.reason ?? '' });
      if (event.announce) {
        const plural = event.IDs.length !== 1;
        addServerAction(
          `${event.IDs.length} message${plural ? 's' : ''} from ${event.target} ${plural ? 'were' : 'was'} purged by ${event.initiator}`,
        );
      }
    });

    pxlsEvents.on('panel:opened', (panel) => {
      if (panel !== 'chat') return;
      ls.set('chat.last_opened_panel', (Date.now() / 1e3) >> 0);
      clearPings();
      markLastSeen();
      if (user().loggedIn) {
        setChatVisualState(canChat());
      } else {
        setChatVisualState(false);
        rateLimitText.value = i18n().t('You must be logged in to chat.');
      }
    });

    pxlsEvents.on('user:loginState', updateInputLoginState);

    window.addEventListener('storage', (event) => {
      if (event.storageArea === window.localStorage && event.key === 'chat-last_seen_id' && event.newValue) {
        const last = lines.value.at(-1);
        if (last?.kind === 'message' && last.id === JSON.parse(event.newValue)) {
          clearPings();
        }
      }
    });

    settings.chat.font.size.listen((value) => {
      if (Number.isNaN(value) || value < 1 || value > 72) {
        modal.showText('Invalid chat font size. Expected a number between 1 and 72.');
        settings.chat.font.size.set(16);
      }
    });

    settings.chat.truncate.max.listen((value) => {
      if (Number.isNaN(value) || value < 50) {
        modal.showText('Invalid maximum chat messages. Expected a number greater than 50.');
        settings.chat.truncate.max.set(50);
      }
    });
  }

  async function webinit(data: WebInfo) {
    charLimit.value = data.chatCharacterLimit;
    linkMinimumPixelCount = data.chatLinkMinimumPixelCount;
    sendLinkToStaff = data.chatLinkSendToStaff;
    defaultExternalLinkPopup = data.chatDefaultExternalLinkPopup;
    ratelimitMessage = data.chatRatelimitMessage;
    canvasBanRespected = data.chatRespectsCanvasBan;

    if (!enabled.value) return;
    if (!data.chatEnabled) {
      panels.setEnabled('chat', false);
      return;
    }

    const emotes7TV = data.emoteSet7TV ? await init7TV(data.emoteSet7TV) : [];
    customEmoji.value = [
      ...data.customEmoji.map(({ name, emoji }) => ({ name, emoji: `./emoji/${emoji}` })),
      ...emotes7TV,
    ];
    initTypeahead();
    await loadHistory();
  }

  async function setNameColor(color: number): Promise<string | null> {
    try {
      await postForm('/chat/setColor', { color });
      user().chatNameColor = color;
      return null;
    } catch (error) {
      if (error instanceof HttpError) {
        return `Couldn't change chat color: ${await readErrorDetails(error.response)}`;
      }
      throw error;
    }
  }

  return {
    lines,
    messagesById,
    ignored,
    pingsList,
    pings,
    triggerHasPing,
    iconHasNotification,
    stickToBottom,
    input,
    replyTarget,
    replyMention,
    hint,
    rateLimitText,
    inputDisabled,
    overlayVisible,
    emojiButtonVisible,
    charLimit,
    enabled,
    highlightedId,
    customEmoji,
    typeahead,
    init,
    webinit,
    processMessage,
    send,
    checkInput,
    startReply,
    cancelReply,
    appendToInput,
    addTypeaheadUser,
    scanTypeahead,
    selectTypeahead,
    insertTypeahead,
    resetTypeahead,
    addIgnore,
    removeIgnore,
    clearPings,
    markLastSeen,
    scrollToMessage,
    handleAction,
    handleTemplateLinkAction,
    updateCanvasBanState,
    updateInputLoginState,
    registerHook,
    replaceHook,
    unregisterHook,
    setNameColor,
    legacyApi,
    addServerAction,
    getIgnores: () => [...ignored.value],
    reloadIgnores,
    saveIgnores,
  };
});

export function nodesToText(nodes: Node[]): string {
  return nodes.map((node) => node.textContent ?? '').join('');
}

/** UI-only chat events (scrolling, focus) between the store and components. */
export const chatEvents = mitt<{
  scrollToBottom: undefined;
  scrollTo: number;
  focusInput: undefined;
  closePopups: undefined;
}>();

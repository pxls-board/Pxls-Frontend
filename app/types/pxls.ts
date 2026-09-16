/** Shapes of the data the Pxls back end sends over HTTP and the WebSocket. */

export interface PaletteColor {
  name: string;
  value: string;
}

export interface AuthService {
  id: string;
  name: string;
  registrationEnabled: boolean;
}

export interface ChatGradient {
  name: string;
  gradient: string;
}

export interface CustomEmoji {
  name: string;
  emoji: string;
}

export interface WebInfo {
  canvasCode: string;
  width: number;
  height: number;
  palette: PaletteColor[];
  captchaKey?: string;
  heatmapCooldown: number;
  maxStacked: number;
  authServices: Record<string, AuthService>;
  registrationEnabled: boolean;
  chatEnabled: boolean;
  chatRespectsCanvasBan: boolean;
  chatCharacterLimit: number;
  chatBannerText: string[];
  snipMode: boolean;
  emoteSet7TV?: string;
  customEmoji: CustomEmoji[];
  corsBase: string;
  corsParam: string;
  legal: { termsUrl?: string; privacyUrl?: string };
  chatRatelimitMessage: string;
  chatLinkMinimumPixelCount: number;
  chatLinkSendToStaff: boolean;
  chatDefaultExternalLinkPopup: boolean;
  chatGradients: ChatGradient[];
}

export interface Role {
  id: string;
  name: string;
  guest: boolean;
  defaultRole: boolean;
  inherits: Role[];
  badges: Badge[];
  permissions: string[];
}

export interface PlacementOverrides {
  ignoreCooldown: boolean;
  canPlaceAnyColor: boolean;
  ignorePlacemap: boolean;
}

export interface Badge {
  displayName: string;
  tooltip: string;
  type: 'text' | 'icon';
  cssIcon?: string;
}

export interface StrippedFaction {
  id: number;
  name: string;
  tag: string;
  color: number;
}

export interface ChatPurge {
  initiator: string;
  reason: string;
}

export interface ChatPacket {
  id: number;
  author: string;
  date: number;
  message_raw: string;
  purge?: ChatPurge | null;
  badges: Badge[];
  authorNameColor: number;
  authorWasShadowBanned?: boolean;
  strippedFaction?: StrippedFaction | null;
  replyingToId: number;
  replyShouldMention: boolean;
}

export interface PxlsNotification {
  id: number;
  title: string;
  content: string;
  who?: string;
  time: number;
  expiry: number;
}

export interface LookupData {
  id?: number;
  x: number;
  y: number;
  bg?: boolean;
  username?: string;
  faction?: string;
  origin?: string;
  time?: number;
  pixelCount?: number;
  pixelCountAlltime?: number;
  discordName?: string;
  [key: string]: unknown;
}

export interface ChatbanRecord {
  initiator_name: string;
  type: 'TEMP' | 'PERMA' | 'UNBAN';
  reason: string;
  when: number;
  expiry: number;
  purged: boolean;
}

export interface SocketMessages {
  pixel: { pixels: { x: number; y: number; color: number }[] };
  pixels: { count: number; cause: string };
  users: { count: number };
  userinfo: {
    username: string;
    pixelCount: number;
    pixelCountAllTime: number;
    placementOverrides: PlacementOverrides;
    chatNameColor: number;
    roles: Role[];
    renameRequested: boolean;
    discordName: string | null;
    method: string;
    banExpiry: number;
    banned: boolean;
    banReason: string;
  };
  pixelCounts: { pixelCount: number; pixelCountAllTime: number };
  admin_placement_overrides: { placementOverrides: PlacementOverrides };
  rename: { requested: boolean };
  rename_success: { newName: string };
  ACK: { ackFor: 'PLACE' | 'UNDO'; x: number; y: number };
  captcha_required: Record<string, never>;
  captcha_status: { success: boolean };
  can_undo: { time: number };
  cooldown: { wait: number };
  alert: { message: string; sender?: string };
  received_report: { report_type: string };
  notification: { notification: PxlsNotification | null };
  chat_message: { message: ChatPacket };
  chat_user_update: {
    who: string;
    updates: { NameColor?: number; DisplayedFaction?: StrippedFaction | null };
  };
  faction_update: { faction: StrippedFaction };
  faction_clear: { fid: number };
  message_cooldown: { diff: number; message: string };
  chat_message_blocked: { message: string };
  chat_lookup: {
    target: { username: string; chatNameColor: number };
    history: { content: string; sent: number; purged: boolean }[];
    chatbans: ChatbanRecord[];
  };
  chat_ban: ChatBanPacket;
  chat_ban_state: ChatBanPacket;
  chat_purge: { target: string; amount: number; announce: boolean; initiator: string; reason?: string };
  chat_purge_specific: { target: string; IDs: number[]; announce: boolean; initiator: string; reason?: string };
}

export interface ChatBanPacket {
  type: 'chat_ban' | 'chat_ban_state';
  expiry: number;
  permanent: boolean;
  reason?: string;
}

export type SocketMessageType = keyof SocketMessages;

export type SocketMessage<T extends SocketMessageType = SocketMessageType> = SocketMessages[T] & {
  type: T;
};

/**
 * Every icon used by the app. Swapping the icon set only needs changes here
 * (and in app.config.ts for Nuxt UI's own icons).
 */
export const ICONS = {
  info: 'i-material-symbols-info-outline-rounded',
  help: 'i-material-symbols-help-outline-rounded',
  notifications: 'i-material-symbols-notifications-outline-rounded',
  lock: 'i-material-symbols-lock-outline',
  unlock: 'i-material-symbols-lock-open-right-outline',
  settings: 'i-material-symbols-settings-outline-rounded',
  chat: 'i-material-symbols-chat-outline-rounded',
  close: 'i-material-symbols-close-rounded',
  collapse: 'i-material-symbols-keyboard-arrow-down-rounded',
  expand: 'i-material-symbols-keyboard-arrow-up-rounded',
  user: 'i-material-symbols-person-outline-rounded',
  logout: 'i-material-symbols-logout-rounded',
  canvasPixels: 'i-material-symbols-show-chart-rounded',
  allTimePixels: 'i-material-symbols-area-chart-outline-rounded',
  online: 'i-material-symbols-group-outline-rounded',
  coords: 'i-material-symbols-explore-outline-rounded',
  pixels: 'i-material-symbols-deployed-code-outline',
  loading: 'i-material-symbols-progress-activity',
  cooldown: 'i-material-symbols-schedule-outline-rounded',
  mention: 'i-material-symbols-alternate-email-rounded',
  jumpToBottom: 'i-material-symbols-arrow-downward-rounded',
  emoji: 'i-material-symbols-mood-outline-rounded',
  warning: 'i-material-symbols-warning-outline-rounded',
  reply: 'i-material-symbols-reply-rounded',
  jump: 'i-material-symbols-open-in-new-rounded',
  expiry: 'i-material-symbols-schedule-outline-rounded',
  undo: 'i-material-symbols-undo-rounded',
  back: 'i-material-symbols-arrow-back-rounded',
  profile: 'i-material-symbols-account-circle-outline',
  factions: 'i-material-symbols-groups-outline-rounded',
  reports: 'i-material-symbols-flag-outline-rounded',
  edit: 'i-material-symbols-edit-outline-rounded',
  delete: 'i-material-symbols-delete-outline-rounded',
  add: 'i-material-symbols-add-rounded',
  search: 'i-material-symbols-search-rounded',
  star: 'i-material-symbols-star-rounded',
  leave: 'i-material-symbols-exit-to-app-rounded',
  ban: 'i-material-symbols-block',
  upload: 'i-material-symbols-upload-file-outline-rounded',
  image: 'i-material-symbols-image-outline-rounded',
  menu: 'i-material-symbols-menu-rounded',
  check: 'i-material-symbols-check-rounded',
  badge: 'i-material-symbols-verified-outline-rounded',
  copy: 'i-material-symbols-content-copy-outline-rounded',
  visible: 'i-material-symbols-visibility-outline-rounded',
  transfer: 'i-material-symbols-swap-horiz-rounded',
  join: 'i-material-symbols-group-add-outline-rounded',
} as const;

export type IconName = keyof typeof ICONS;

/**
 * Font Awesome names sent by the back end (chat badges, banner markdown
 * `[fa …]`) mapped to their closest Material Symbols equivalent.
 */
const FONT_AWESOME_ICONS: Record<string, string> = {
  'crown': 'i-material-symbols-crown-outline-rounded',
  'gavel': 'i-material-symbols-gavel-rounded',
  'hammer': 'i-material-symbols-construction-rounded',
  'shield': 'i-material-symbols-shield-outline-rounded',
  'shield-alt': 'i-material-symbols-shield-outline-rounded',
  'user-shield': 'i-material-symbols-admin-panel-settings-outline-rounded',
  'code': 'i-material-symbols-code-rounded',
  'terminal': 'i-material-symbols-terminal-rounded',
  'bug': 'i-material-symbols-bug-report-outline-rounded',
  'star': 'i-material-symbols-star-rounded',
  'heart': 'i-material-symbols-favorite-rounded',
  'dollar-sign': 'i-material-symbols-attach-money-rounded',
  'donate': 'i-material-symbols-volunteer-activism-outline-rounded',
  'gem': 'i-material-symbols-diamond-outline-rounded',
  'paint-brush': 'i-material-symbols-brush-outline-rounded',
  'palette': 'i-material-symbols-palette-outline',
  'check': 'i-material-symbols-check-rounded',
  'check-circle': 'i-material-symbols-check-circle-outline-rounded',
  'info-circle': ICONS.info,
  'question-circle': ICONS.help,
  'exclamation-triangle': ICONS.warning,
  'bell': ICONS.notifications,
  'comment': ICONS.chat,
  'comment-alt': ICONS.chat,
  'discord': 'i-material-symbols-forum-outline-rounded',
  'link': 'i-material-symbols-link-rounded',
  'external-link-alt': ICONS.jump,
  'user': ICONS.user,
  'users': ICONS.online,
  'clock': ICONS.cooldown,
  'calendar': 'i-material-symbols-calendar-month-outline-rounded',
  'trophy': 'i-material-symbols-trophy-outline-rounded',
  'medal': 'i-material-symbols-military-tech-outline-rounded',
  'award': 'i-material-symbols-workspace-premium-outline-rounded',
  'fire': 'i-material-symbols-local-fire-department-outline-rounded',
  'bolt': 'i-material-symbols-bolt-outline-rounded',
  'robot': 'i-material-symbols-smart-toy-outline-rounded',
  'eye': 'i-material-symbols-visibility-outline-rounded',
  'cube': ICONS.pixels,
  'map': 'i-material-symbols-map-outline-rounded',
  'globe': 'i-material-symbols-public',
  'flag': ICONS.reports,
  'lock': ICONS.lock,
  'times': ICONS.close,
  'cog': ICONS.settings,
  'cogs': ICONS.settings,
};

/** Resolves a Font Awesome class list like `"fas fa-crown"` to an icon name. */
export function iconFromFontAwesome(classes: string | string[]): string {
  const list = Array.isArray(classes) ? classes : classes.split(/\s+/);
  for (const cls of list) {
    if (!cls.startsWith('fa-')) continue;
    const icon = FONT_AWESOME_ICONS[cls.slice(3)];
    if (icon) return icon;
  }
  return ICONS.badge;
}

export function faIconNames(): string[] {
  return Object.values(FONT_AWESOME_ICONS);
}

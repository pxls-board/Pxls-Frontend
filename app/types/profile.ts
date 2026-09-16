import type { Role } from './pxls';

export interface FactionMember {
  id: number;
  name: string;
}

export interface Faction {
  id: number;
  name: string;
  tag: string;
  color: number;
  ownerId: number;
  ownerName: string;
  members: FactionMember[];
  bans: { name: string }[];
}

export interface ProfileUser {
  id: number;
  username: string;
  name: string;
  signupTime: number;
  pixelCount: number;
  pixelCountAllTime: number;
  discordName: string | null;
  displayedFactionId: number | null;
  factions: Faction[];
  roles: Role[];
  isBanned: boolean;
  isPermaBanned: boolean;
  banExpiry: number;
  isChatBanned: boolean;
  isPermaChatBanned: boolean;
  chatBanExpiry: number;
  isFactionRestricted: boolean;
}

export interface ProfileReport {
  target: string;
  time: number;
  message: string;
  closed: boolean;
}

export interface ProfileData {
  user: ProfileUser;
  self: { id: number; name: string; pixelCountAllTime: number } | null;
  canvasReports?: ProfileReport[];
  chatReports?: ProfileReport[];
  keys?: Record<string, string>;
  palette?: string;
  maxFactionTagLength?: number;
  maxFactionNameLength?: number;
  newFactionMinPixels?: number;
  snipMode?: boolean;
  details?: string;
}

export interface FactionSearchResult {
  id: number;
  name: string;
  tag: string;
  owner: string;
  memberCount: number;
  creation_ms: number;
  canvasCode: string;
  userJoined: boolean;
}

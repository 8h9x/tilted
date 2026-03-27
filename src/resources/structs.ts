/* eslint-disable camelcase */
import type { Collection } from "@discordjs/collection";
import type { HTTPConfig } from "../http/types.ts";
import type { PathLike } from "node:fs";
// deno-lint-ignore verbatim-module-syntax
import defaultPartyMeta from "./defaultPartyMeta.json" with { type: "json" };
// deno-lint-ignore verbatim-module-syntax
import defaultPartyMemberMeta from "./defaultPartyMemberMeta.json" with {
  type: "json",
};
import type EpicgamesAPIError from "../exceptions/EpicgamesAPIError.ts";
import type BlockedUser from "../structures/user/BlockedUser.ts";
import type ClientParty from "../structures/party/ClientParty.ts";
import type ClientPartyMember from "../structures/party/ClientPartyMember.ts";
import type ClientUser from "../structures/user/ClientUser.ts";
import type Friend from "../structures/friend/Friend.ts";
import type FriendPresence from "../structures/friend/FriendPresence.ts";
import type IncomingPendingFriend from "../structures/friend/IncomingPendingFriend.ts";
import type OutgoingPendingFriend from "../structures/friend/OutgoingPendingFriend.ts";
import type ReceivedPartyJoinRequest from "../structures/party/ReceivedPartyJoinRequest.ts";
import type PartyMember from "../structures/party/PartyMember.ts";
import type PartyMemberConfirmation from "../structures/party/PartyMemberConfirmation.ts";
import type PartyMessage from "../structures/party/PartyMessage.ts";
import type ReceivedPartyInvitation from "../structures/party/ReceivedPartyInvitation.ts";
import type User from "../structures/user/User.ts";
import type {
  EpicgamesOAuthData,
  STWMissionAlertData,
  STWMissionData,
  STWProfileLockerSlotData,
  STWTheaterData,
  TournamentWindowTemplateData,
} from "./httpResponses.ts";
import type ReceivedFriendMessage from "../structures/friend/ReceivedFriendMessage.ts";
import type STWSurvivor from "../structures/stw/STWSurvivor.ts";
import type { AuthSessionStoreKey } from "./enums.ts";
import type FortniteAuthSession from "../auth/FortniteAuthSession.ts";
import type LauncherAuthSession from "../auth/LauncherAuthSession.ts";
import type FortniteClientCredentialsAuthSession from "../auth/FortniteClientCredentialsAuthSession.ts";
import type EOSAuthSession from "../auth/EOSAuthSession.ts";

export type PartyMemberSchema = Partial<typeof defaultPartyMemberMeta>;
export type PartySchema = Partial<typeof defaultPartyMeta> & {
  "urn:epic:cfg:presence-perm_s"?: string;
  "urn:epic:cfg:accepting-members_b"?: string;
  "urn:epic:cfg:invite-perm_s"?: string;
  "urn:epic:cfg:not-accepting-members"?: string;
  "urn:epic:cfg:not-accepting-members-reason_i"?: string;
};

export type Schema = Record<string, string | undefined>;

export type Language =
  | "de"
  | "ru"
  | "ko"
  | "zh-hant"
  | "pt-br"
  | "en"
  | "it"
  | "fr"
  | "zh-cn"
  | "es"
  | "ar"
  | "ja"
  | "pl"
  | "es-419"
  | "tr";

export type StringFunction = () => string;

export type StringFunctionAsync = () => Promise<string>;

export interface DeviceAuth {
  /**
   * The device auth's account ID
   */
  accountId: string;

  /**
   * The device auth's device ID (that does not mean it can only be used on a single device)
   */
  deviceId: string;

  /**
   * The device auth's secret
   */
  secret: string;
}

export interface DeviceAuthWithSnakeCaseSupport extends DeviceAuth {
  /**
   * The device auth's account ID
   */
  account_id?: string;

  /**
   * The device auth's device ID (that does not mean it can only be used on a single device)
   */
  device_id?: string;
}

export type DeviceAuthFunction = () => DeviceAuth;

export type DeviceAuthFunctionAsync = () => Promise<DeviceAuth>;

export type DeviceAuthResolveable =
  | DeviceAuth
  | PathLike
  | DeviceAuthFunction
  | DeviceAuthFunctionAsync;

export type AuthStringResolveable =
  | string
  | PathLike
  | StringFunction
  | StringFunctionAsync;

export type Platform =
  | "WIN"
  | "MAC"
  | "PSN"
  | "XBL"
  | "SWT"
  | "SWT2"
  | "IOS"
  | "AND"
  | "PS5"
  | "XSX";

export type AuthClient =
  | "fortnitePCGameClient"
  | "fortniteIOSGameClient"
  | "fortniteAndroidGameClient"
  | "fortniteSwitchGameClient"
  | "fortniteCNGameClient"
  | "launcherAppClient2"
  | "Diesel - Dauntless";

export interface RefreshTokenData {
  /**
   * The refresh token
   */
  token: string;

  /**
   * The refresh token's expiration time in seconds
   */
  expiresIn: number;

  /**
   * The refresh token's expiration date
   */
  expiresAt: string;

  /**
   * The ID of the account the refresh token belongs to
   */
  accountId: string;

  /**
   * The display name of the account the refresh token belongs to
   */
  displayName: string;

  /**
   * The refresh token's client ID (will always be the ID of launcherAppClient2)
   */
  clientId: string;
}

export interface CacheSetting {
  /**
   * How long the data should stay in the cache until it is considered sweepable (in seconds, 0 for no cache, Infinity for infinite)
   */
  maxLifetime: number;

  /**
   * How frequently to remove cached data that is older than the lifetime (in seconds, 0 for never)
   */
  sweepInterval: number;
}

export interface CacheSettings {
  /**
   * The presence cache settings
   */
  presences?: CacheSetting;

  /**
   * The user cache settings
   */
  users?: CacheSetting;
}

export interface AuthOptions {
  /**
   * A device auth object, a function that returns a device auth object or a path to a file containing a device auth object
   */
  deviceAuth?: DeviceAuthResolveable;

  /**
   * An exchange code, a function that returns an exchange code or a path to a file containing an exchange code
   */
  exchangeCode?: AuthStringResolveable;

  /**
   * An authorization code, a function that returns an authorization code or a path to a file containing an authorization code
   */
  authorizationCode?: AuthStringResolveable;

  /**
   * A refresh token, a function that returns a refresh token or a path to a file containing a refresh token
   */
  refreshToken?: AuthStringResolveable;

  /**
   * A launcher refresh token, a function that returns a launcher refresh token or a path to a file containing a launcher refresh token
   */
  launcherRefreshToken?: AuthStringResolveable;

  /**
   * Whether the client should check whether the EULA has been accepted.
   * Do not modify this unless you know what you're doing
   */
  checkEULA?: boolean;

  /**
   * Whether the client should kill other active Fortnite auth sessions on startup
   */
  killOtherTokens?: boolean;

  /**
   * Whether the client should create a launcher auth session and keep it alive.
   * The launcher auth session can be accessed via `client.auth.auths.get('launcher')`
   */
  createLauncherSession?: boolean;

  /**
   * The Fortnite auth client (eg. 'fortnitePCGameClient' or 'fortniteAndroidGameClient')
   */
  authClient?: AuthClient;
}

export interface PartyPrivacy {
  partyType: "Public" | "FriendsOnly" | "Private";
  inviteRestriction: "AnyMember" | "LeaderOnly";
  onlyLeaderFriendsCanJoin: boolean;
  presencePermission: "Anyone" | "Leader" | "Noone";
  invitePermission: "Anyone" | "AnyMember" | "Leader";
  acceptingMembers: boolean;
}

export interface PartyOptions {
  joinConfirmation?: boolean;
  joinability?: "OPEN" | "INVITE_AND_FORMER";
  discoverability?: "ALL" | "INVITED_ONLY";
  privacy?: PartyPrivacy;
  maxSize?: number;
  intentionTtl?: number;
  inviteTtl?: number;
  chatEnabled?: boolean;
}

export interface PartyConfig {
  type: "DEFAULT";
  joinability: "OPEN" | "INVITE_AND_FORMER";
  discoverability: "ALL" | "INVITED_ONLY";
  subType: "default";
  maxSize: number;
  inviteTtl: number;
  intentionTtl: number;
  joinConfirmation: boolean;
  privacy: PartyPrivacy;
}

export type PresenceOnlineType = "online" | "away" | "chat" | "dnd" | "xa";

export type StatsPlaylistType = "other" | "solo" | "duo" | "squad" | "ltm";

export interface ClientConfig {
  /**
   * Whether the party member meta (outfit, emote, etc) should be saved so they are kept when joining a new party
   */
  savePartyMemberMeta: boolean;

  /**
   * Additional request options
   */
  http: HTTPConfig;

  /**
   * Debug function used for general debugging purposes
   */
  debug?: (message: string) => void;

  /**
   * Debug function used for http requests
   */
  httpDebug?: (message: string) => void;

  /**
   * Debug function used for incoming and outgoing xmpp xml payloads
   */
  xmppDebug?: (message: string) => void;

  /**
   * Debug function used for incoming and outgoing stomp eos connect messages
   */
  stompDebug?: (message: string) => void;

  /**
   * Default friend presence of the bot (eg. "Playing Battle Royale")
   */
  defaultStatus?: string;

  /**
   * Default online type of the bot (eg "away"). None for online
   */
  defaultOnlineType: PresenceOnlineType;

  /**
   * The client's platform (WIN by default)
   */
  platform: Platform;

  /**
   * The client's default party member meta (can be used to set a custom default skin, etc)
   */
  defaultPartyMemberMeta: Schema;

  /**
   * Custom keep alive interval for the xmpp websocket connection.
   * You should lower this value if the client randomly reconnects
   */
  xmppKeepAliveInterval: number;

  /**
   * The maximum amount of times the client should try to reconnect to XMPP before giving up
   */
  xmppMaxConnectionRetries: number;

  /**
   * Settings that affect the way the client caches certain data
   */
  cacheSettings: CacheSettings;

  /**
   * Client authentication options. By default the client will ask you for an authorization code
   */
  auth: AuthOptions;

  /**
   * Default config used for creating parties
   */
  partyConfig: PartyOptions;

  /**
   * Whether the client should create a party on startup
   */
  createParty: boolean;

  /**
   * Whether a new party should be force created on start (even if the client is already member of a party)
   */
  forceNewParty: boolean;

  /**
   * Whether to completely disable all party related functionality
   */
  disablePartyService: boolean;

  /**
   * Whether the client should connect via XMPP.
   * NOTE: If you disable this, almost all features related to friend caching will no longer work.
   * Do not disable this unless you know what you're doing
   */
  connectToXMPP: boolean;

  /**
   * Whether the client should connect to eos connect stomp
   * NOTE: If you disable this, receiving party or private messages will no longer work.
   * Do not disable this unless you know what you're doing
   */
  connectToSTOMP: boolean;

  /**
   * Whether the client should fetch all friends on startup.
   * NOTE: If you disable this, almost all features related to friend caching will no longer work.
   * Do not disable this unless you know what you're doing
   */
  fetchFriends: boolean;

  /**
   * Timeout (in ms) for how long a friend is considered online after the last presence was received.
   * Note: Usually the client will receive a presence when the friend goes offline, when that does not happen, this timeout will be used
   */
  friendOfflineTimeout: number;

  /**
   * How many times to retry on HTTP 5xx errors
   */
  restRetryLimit: number;

  /**
   * Whether the client should handle rate limits (429 status code responses)
   */
  handleRatelimits: boolean;

  /**
   * The party build id (does not change very often, don't change this unless you know what you're doing)
   */
  partyBuildId: string;

  /**
   * Whether the client should restart if a refresh token is invalid.
   * Refresh tokens can be invalid if you logged in with another client on the same account.
   * By default, this is set to false because two clients attempting to log into one account could result in an endless loop
   */
  restartOnInvalidRefresh: boolean;

  /**
   * The default language for all http requests.
   * Will be overwritten by a method's language parameter
   */
  language: Language;

  /**
   * Amount of time (in ms) to wait after the initial xmpp connection before emitting friend:online events
   */
  friendOnlineConnectionTimeout: number;

  /**
   * A custom parser for resolving the stats playlist type (ie. "solo", "duo", "ltm").
   * Can be useful if you want to use data in the game files to determine the stats playlist type
   */
  statsPlaylistTypeParser?: (playlistId: string) => StatsPlaylistType;

  /**
   * Fortnite deployment id (eos)
   */
  eosDeploymentId: string;

  /**
   * Amount of time (in ms) to wait for the XMPP connection to be established
   */
  xmppConnectionTimeout: number;

  /**
   * Amount of time (in ms) to wait for the STOMP connection to be established
   */
  stompConnectionTimeout: number;
}

export interface MatchMeta {
  location?: "PreLobby" | "InGame" | "ReturningToFrontEnd";
  hasPreloadedAthena?: boolean;
  isSpectatable?: boolean;
  playerCount?: number;
  matchStartedAt?: Date;
}

export interface ClientOptions extends Partial<ClientConfig> {}

export interface ClientEventMap {
  /**
   * Dispatched when a device auth has been created by the client
   * @see {@link DeviceAuth}
   */
  "deviceauth:created": {
    /** The newly created device auth */
    deviceAuth: DeviceAuth;
  };

  /**
   * Dispatched when the client has disconnected
   */
  disconnected: void;

  /**
   * Dispatched when a user has been added to the client's friend list
   * @see {@link Friend}
   */
  "friend:added": {
    /** The new friend */
    friend: Friend;
  };

  /**
   * Dispatched when the client receives a friend whisper message
   * @see {@link ReceivedFriendMessage}
   */
  "friend:message": {
    /** The received friend whipser message */
    message: ReceivedFriendMessage;
  };

  /**
   * Dispatched when one of the client's friends goes offline
   * @see {@link Friend}
   */
  "friend:offline": {
    /** The friend that went offline */
    friend: Friend;
  };

  /**
   * Dispatched when one of the client's friends becomes online
   * @see {@link Friend}
   */
  "friend:online": {
    /** The friend that became online */
    friend: Friend;
  };

  /**
   * Dispatched when the client receives a friend presence
   * @see {@link FriendPresence}
   */
  "friend:presence": {
    /** The friend's previous presence */
    prev: FriendPresence | undefined;
    /** The friend's current presence */
    next: FriendPresence;
  };

  /**
   * Dispatched when a user has been removed from the client's friend list
   * @see {@link Friend}
   */
  "friend:removed": {
    /** The friend */
    friend: Friend;
  };

  /**
   * Dispatched when the client recieves a friendship request
   * @see {@link IncomingPendingFriend}
   */
  "friend:request": {
    /** The pending friend */
    pendingFriend: IncomingPendingFriend;
  };

  /**
   * Dispatched when the client aborted an outgoing friendship request or when someone aborted an incoming friendship request
   * @see {@link IncomingPendingFriend}
   * @see {@link OutgoingPendingFriend}
   */
  "friend:request:aborted": {
    /** The previously pending friend */
    pendingFriend: IncomingPendingFriend | OutgoingPendingFriend;
  };

  /**
   * Dispatched when the client declined an incoming friendship request or when someone declined an outgoing friendship request
   * @see {@link IncomingPendingFriend}
   * @see {@link OutgoingPendingFriend}
   */
  "friend:request:declined": {
    /** The previously pending friend */
    pendingFriend: IncomingPendingFriend | OutgoingPendingFriend;
  };

  /**
   * Dispatched when the client sends a friendship request
   * @see {@link OutgoingPendingFriend}
   */
  "friend:request:sent": {
    /** The pending friend */
    pendingFriend: OutgoingPendingFriend;
  };

  /**
   * Dispatched when the client receives a party invitation
   * @see {@link ReceivedPartyInvitation}
   */
  "party:invite": {
    /** The received party invitation */
    invitation: ReceivedPartyInvitation;
  };

  /**
   * Dispatched when a party member requires confirmation
   * @see {@link PartyMemberConfirmation}
   */
  "party:member:confirmation": {
    /** The pending party member confirmation */
    confirmation: PartyMemberConfirmation;
  };

  /**
   * Dispatched when a member of the client's party has disconnected
   * @see {@link PartyMember}
   */
  "party:member:disconnected": {
    /** The party member */
    member: PartyMember;
  };

  /**
   * Dispatched when a party member expired
   * @see {@link PartyMember}
   */
  "party:member:expired": {
    /** The party member */
    member: PartyMember;
  };

  /**
   * Dispatched when a new member joins the client's party
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:joined": {
    /** The member who joined the client's party */
    member: PartyMember | ClientPartyMember;
  };

  /**
   * Dispatched when a member of the client's party has been kicked
   * @see {@link PartyMember}
   */
  "party:member:kicked": {
    /** The party member */
    member: PartyMember;
  };

  /**
   * Dispatched when a member leaves the client's party
   * @see {@link PartyMember}
   */
  "party:member:left": {
    /** The party member */
    member: PartyMember;
  };

  /**
   * Dispatched when a member in the client's party sends a message in the party chat
   * @see {@link PartyMessage}
   */
  "party:member:message": {
    /** The received message */
    message: PartyMessage;
  };

  /**
   * Dispatched when a member of the client's party has updated their backpack
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:backpack:updated": {
    /** The party member whose backpack changed */
    member: PartyMember | ClientPartyMember;
    /** The previous backpack */
    prev?: string;
    /** The new backpack */
    next?: string;
  };

  /**
   * Dispatched when a member of the client's party has updated their emote
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:emote:updated": {
    /** The party member whose emote changed */
    member: PartyMember | ClientPartyMember;
    /** The previous emote */
    prev?: string;
    /** The new emote */
    next?: string;
  };

  /**
   * Dispatched when a member of the client's party has updated their match state
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   * @see {@link MatchMeta}
   */
  "party:member:matchstate:updated": {
    /** The party member whose match state changed */
    member: PartyMember | ClientPartyMember;
    /** The previous match state */
    prev?: MatchMeta;
    /** The new match state */
    next?: MatchMeta;
  };

  /**
   * Dispatched when a member of the client's party has updated their outfit
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:outfit:updated": {
    /** The party member whose outfit changed */
    member: PartyMember | ClientPartyMember;
    /** The previous outfit */
    prev?: string;
    /** The new outfit */
    next?: string;
  };

  /**
   * Dispatched when a member of the client's party has updated their pickaxe
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:pickaxe:updated": {
    /** The party member whose pickaxe changed */
    member: PartyMember | ClientPartyMember;
    /** The previous pickaxe */
    prev?: string;
    /** The new pickaxe */
    next?: string;
  };

  /**
   * Dispatched when a member of the client's party has updated their readiness state
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:readiness:updated": {
    /** The party member whose readiness state changed */
    member: PartyMember | ClientPartyMember;
    /** The previous readiness state (true = "READY" | false = "UNREADY") */
    prev?: boolean;
    /** The new readiness state (true = "READY" | false = "UNREADY") */
    next?: boolean;
  };

  /**
   * Dispatched when a member of the client's party has been promoted
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:promoted": {
    /** The party member */
    member: PartyMember | ClientPartyMember;
  };

  /**
   * Dispatched when a member of the client's party has been updated
   * @see {@link ClientPartyMember}
   * @see {@link PartyMember}
   */
  "party:member:updated": {
    /** The updated party member */
    member: PartyMember | ClientPartyMember;
  };

  /**
   * Dispatched when a friend requests to join the client's party
   * @see {@link ReceivedPartyJoinRequest}
   */
  "party:joinrequest": {
    /** The recieved join request */
    request: ReceivedPartyJoinRequest;
  };

  /**
   * Dispatched when the client's party has been updated
   * @see {@link ClientParty}
   */
  "party:updated": {
    /** The updated party */
    party: ClientParty;
  };

  /**
   * Dispatched when the client is ready
   */
  ready: void;

  /**
   * Dispatched when a refresh token has been created by the client
   * @see {@link RefreshTokenData}
   */
  "refreshtoken:created": {
    /** The newly created refresh token data */
    refreshTokenData: RefreshTokenData;
  };

  /**
   * Dispatched when a user has been added to the client's block list
   * @see {@link BlockedUser}
   */
  "user:blocked": {
    /** The user that has been blocked */
    blockedUser: BlockedUser;
  };

  /**
   * Dispatched when a user has been removed to the client's block list
   * @see {@link BlockedUser}
   */
  "user:unblocked": {
    /** The user that has been unblocked */
    blockedUser: BlockedUser;
  };

  /**
   * Dispatched when an error occurs while processing an incoming xmpp chat message (either a friend or party message)
   */
  "xmpp:chat:error": {
    /** The error that occurred */
    error: Error;
  };

  /**
   * Dispatched when an error occurs while processing an incoming xmpp message
   */
  "xmpp:message:error": {
    /** The error that occurred */
    error: Error;
  };

  /**
   * Dispatched when an error occurs while processing an incoming xmpp presence
   */
  "xmpp:presence:error": {
    /** The error that occurred */
    error: Error;
  };
}

export type AuthType = "fortnite" | "fortniteClientCredentials" | "launcher";

export interface AuthResponse {
  response?: EpicgamesOAuthData;
  error?: EpicgamesAPIError | Error;
}

export interface ReauthResponse {
  response?: {
    success: boolean;
  };
  error?: EpicgamesAPIError;
}

export interface FriendConnection {
  name?: string;
}

export interface FriendConnections {
  epic?: FriendConnection;
  psn?: FriendConnection;
  nintendo?: FriendConnection;
}

export interface PresenceGameplayStats {
  kills?: number;
  fellToDeath?: boolean;
  serverPlayerCount?: number;
}

export type PendingFriendDirection = "INCOMING" | "OUTGOING";

export interface StatsPlaylistTypeData {
  score: number;
  scorePerMin: number;
  scorePerMatch: number;
  wins: number;
  top3: number;
  top5: number;
  top6: number;
  top10: number;
  top12: number;
  top25: number;
  kills: number;
  killsPerMin: number;
  killsPerMatch: number;
  deaths: number;
  kd: number;
  matches: number;
  winRate: number;
  minutesPlayed: number;
  playersOutlived: number;
  lastModified?: Date;
}

export interface StatsInputTypeData {
  overall: StatsPlaylistTypeData;
  solo: StatsPlaylistTypeData;
  duo: StatsPlaylistTypeData;
  squad: StatsPlaylistTypeData;
  ltm: StatsPlaylistTypeData;
}

export interface StatsData {
  all: StatsInputTypeData;
  keyboardmouse: StatsInputTypeData;
  gamepad: StatsInputTypeData;
  touch: StatsInputTypeData;
}

export interface NewsMOTD {
  entryType: string;
  image: string;
  tileImage: string;
  videoMute: boolean;
  hidden: boolean;
  tabTitleOverride: string;
  _type: string;
  title: string;
  body: string;
  offerAction: string;
  videoLoop: boolean;
  videoStreamingEnabled: boolean;
  sortingPriority: number;
  buttonTextOverride?: string;
  offerId?: string;
  id: string;
  videoAutoplay: boolean;
  videoFullscreen: boolean;
  spotlight: boolean;
  videoUID?: string;
  videoVideoString?: string;
  playlistId?: string;
}

export interface NewsMessageData {
  image: string;
  hidden: boolean;
  _type: string;
  adspace: string;
  title: string;
  body: string;
  spotlight: boolean;
}

export interface LightswitchLauncherInfo {
  appName: string;
  catalogItemId: string;
  namespace: string;
}

export interface LightswitchData {
  serviceInstanceId: string;
  status: string;
  message: string;
  maintenanceUri?: string;
  overrideCatalogIds: string[];
  allowedActions: string[];
  banned: boolean;
  launcherInfoDTO: LightswitchLauncherInfo;
}

export interface EpicgamesServerStatusData {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  components: {
    id: string;
    name: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    position: number;
    description?: any;
    showcase: boolean;
    start_date: string;
    group_id: string;
    page_id: string;
    group: boolean;
    only_show_if_degraded: boolean;
    components: string[];
  }[];
  incidents: any[];
  scheduled_maintenances: any[];
  status: {
    indicator: string;
    description: string;
  };
}

export interface EpicgamesServerStatusIncidentUpdate {
  id: string;
  body: string;
  createdAt: Date;
  displayAt: Date;
  status: string;
  updatedAt: Date;
}

export interface MessageData {
  content: string;
  author: Friend | PartyMember | ClientPartyMember | ClientUser;
  id: string;
  sentAt?: Date;
}

export interface FriendMessageData extends MessageData {
  author: Friend | ClientUser;
}

export interface PartyMessageData extends MessageData {
  author: PartyMember | ClientPartyMember;
  party: ClientParty;
}

export interface PendingFriendData {
  accountId: string;
  created: string;
  favorite: boolean;
  displayName: string;
}

export interface ExternalAuth {
  accountId: string;
  type: string;
  externalAuthId: string;
  externalAuthIdType: string;
  externalDisplayName?: string;
  authIds: {
    id: string;
    type: string;
  }[];
}

export interface ExternalAuths {
  github?: ExternalAuth;
  twitch?: ExternalAuth;
  steam?: ExternalAuth;
  psn?: ExternalAuth;
  xbl?: ExternalAuth;
  nintendo?: ExternalAuth;
}

export interface UserData {
  id: string;
  displayName?: string;
  externalAuths?: ExternalAuths;
}

export interface ClientUserData extends UserData {
  name: string;
  email: string;
  failedLoginAttempts: number;
  lastLogin: string;
  numberOfDisplayNameChanges: number;
  ageGroup: string;
  headless: boolean;
  country: string;
  lastName: string;
  phoneNumber: string;
  preferredLanguage: string;
  lastDisplayNameChange: string;
  canUpdateDisplayName: boolean;
  tfaEnabled: boolean;
  emailVerified: boolean;
  minorVerified: boolean;
  minorExpected: boolean;
  minorStatus: string;
}

export interface CreatorCodeData {
  slug: string;
  owner: User;
  status: "ACTIVE" | "DISABLED";
  verified: boolean;
}

export interface FriendData extends UserData {
  created: string;
  favorite: boolean;
  displayName?: string;
  connections?: FriendConnections;
  mutual?: number;
  alias: string;
  note: string;
}

export interface FriendPresenceData {
  Status?: string;
  bIsPlaying?: boolean;
  bIsJoinable?: boolean;
  bHasVoiceSupport?: boolean;
  SessionId?: string;
  ProductName?: string;
  Properties?: {
    FortBasicInfo_j?: {
      homeBaseRating?: number;
    };
    FortLFG_I?: string;
    FortPartySize_i?: number;
    FortSubGame_i?: number;
    InUnjoinableMatch_b?: boolean;
    FortGameplayStats_j?: {
      state: string;
      playlist: string;
      numKills: number;
      bFellToDeath: boolean;
    };
    "party.joininfodata.286331153_j"?: {
      bIsPrivate?: boolean;
    };
    GamePlaylistName_s?: string;
    Event_PlayersAlive_s?: string;
    Event_PartySize_s?: string;
    Event_PartyMaxSize_s?: string;
    GameSessionJoinKey_s?: string;
    ServerPlayerCount_i?: string;
  };
}

export interface PartyMemberData {
  id: string;
  account_id: string;
  account_dn?: string;
  meta: Schema;
  revision: number;
  updated_at: string;
  joined_at: string;
  role: string;
}

export interface PartyMemberUpdateData {
  account_id: string;
  account_dn?: string;
  revision: number;
  member_state_updated: Schema;
  member_state_removed: string[];
}

export interface PartyData {
  id: string;
  created_at: string;
  updated_at: string;
  config: {
    type: string;
    joinability: string;
    discoverability: string;
    sub_type: string;
    max_size: number;
    invite_ttl: number;
    join_confirmation: boolean;
    intention_ttl: number;
  };
  members: PartyMemberData[];
  meta: PartySchema;
  invites: any[];
  revision: number;
}

export interface PartyUpdateData {
  revision: number;
  party_state_updated: Schema;
  party_state_removed: string[];
  party_privacy_type: "OPEN" | "INVITE_AND_FORMER";
  max_number_of_members: number;
  party_sub_type: "default";
  party_type: "DEFAULT";
  invite_ttl_seconds: number;
  discoverability: "ALL" | "INVITED_ONLY";
}

export interface Island {
  linkId?: {
    mnemonic?: string;
    version?: number;
  };
  woldId?: {
    iD?: string;
    ownerId?: string;
    name?: string;
  };
  sessionId?: string;
  joinInfo?: {
    islandJoinability?: string;
    bIsWorldJoinable?: boolean;
    sessionKey?: string;
  };
}

export interface PartyMemberIsland {
  LinkId: string;
  MatchmakingSettingsV1: {
    privacy: string;
    productModes: any[];
    regionId: string;
    world: {
      bIsJoinable: boolean;
      iD: string;
      name: string;
      ownerId: string;
    };
  };
  Session: {
    iD: string;
    joinInfo: {
      joinablity: string;
      sessionKey: string;
    };
  };
}

export interface Cosmetics {
  outfit?: {
    id: string;
    variants?: CosmeticVariant[];
    enlightment?: CosmeticEnlightment;
  };
  backpack?: { id: string; variants?: CosmeticVariant[]; path?: string };
  pickaxe?: { id: string; variants?: CosmeticVariant[]; path?: string };
  shoes?: { id: string; path?: string };
}

export interface CosmeticVariant {
  channel: string;
  channelIndex: number;
  variant: string;
  variantIndex: number;
}

export interface CosmeticVariantMeta {
  i: string[];
}

export interface CosmeticsVariantMeta {
  athenaCharacter?: CosmeticVariantMeta;
  athenaBackpack?: CosmeticVariantMeta;
  athenaPickaxe?: CosmeticVariantMeta;
  athenaSkyDiveContrail?: CosmeticVariantMeta;
}

export type CosmeticEnlightment = [number, number];

export interface BannerMeta {
  bannerIconId: string;
  bannerColorId: string;
}

export interface BattlePassMeta {
  bHasPurchasedPass: boolean;
  passLevel: number;
  selfBoostXp: number;
  friendBoostXp: number;
}

export interface AssistedChallengeMeta {
  questItemDef: string;
  objectivesCompleted: number;
}

export type Region = "EU" | "NAE" | "NAW" | "BR" | "ME" | "ASIA" | "OCE";

export type FullPlatform =
  | "Windows"
  | "Android"
  | "PS4"
  | "XboxOne"
  | "XSX"
  | "PS5"
  | "Switch"
  | "Windows"
  | "Mac";

export type SentMessageType = "PARTY" | "FRIEND";

export interface TournamentColors {
  titleColor?: string;
  backgroundTextColor?: string;
  backgroundRightColor?: string;
  backgroundLeftColor?: string;
  shadowColor?: string;
  posterFadeColor?: string;
  baseColor?: string;
  highlightColor?: string;
}

export interface TournamentImages {
  squarePosterImage?: string;
  loadingScreenImage?: string;
  posterBackImage?: string;
  posterFrontImage?: string;
  playlistTileImage?: string;
  tournamentViewBackgroundImage?: string;
}

export interface TournamentTexts {
  pinEarnedText?: string;
  pinScoreRequirement?: number;
  scheduleInfo?: string;
  flavorDescription?: string;
  shortFormatTitle?: string;
  titleLine1?: string;
  titleLine2?: string;
  detailsDescription?: string;
  longFormatTitle?: string;
  backgroundTitle?: string;
}

export interface TournamentWindowTemplate {
  windowId: string;
  templateData: TournamentWindowTemplateData;
}

export interface PresencePartyData {
  bIsPrivate?: boolean;
  sourceId?: string;
  sourceDisplayName?: string;
  sourcePlatform?: string;
  partyId?: string;
  partyTypeId?: number;
  key?: "k";
  appId?: string;
  buildId?: string;
  partyFlags?: number;
  notAcceptingReason?: number;
  pc?: number;
}

export type UserSearchPlatform = "epic" | "psn" | "xbl" | "steam";

export type UserSearchMatchType = "exact" | "prefix";

export interface UserSearchResultMatch {
  value: string;
  platform: UserSearchPlatform;
}

export interface BlurlStream {
  languages: {
    language: string;
    url: string;
    variants: {
      data: {
        codecs: string[];
        bandwidth: number;
        resolution: string;
      };
      type: "video" | "audio";
      url: string;
      stream: Uint8Array;
    }[];
  }[];
  data: {
    subtitles: any;
    ucp?: string;
    audioonly: boolean;
    aspectratio?: string;
    partysync: boolean;
    lrcs: any;
    duration?: number;
  };
}

export interface ReplayEvent {
  Id: string;
  Group: string;
  Metadata: string;
  Time1: number;
  Time2: number;
  data: Uint8Array;
}

export interface ReplayDataChunk {
  Id: string;
  Time1: number;
  Time2: number;
  SizeInBytes: number;
  data: Uint8Array;
}

export interface ReplayCheckpoint {
  Id: string;
  Group: string;
  Metadata: string;
  Time1: number;
  Time2: number;
  data: Uint8Array;
}

export interface ReplayData {
  ReplayName: string;
  LengthInMS: number;
  NetworkVersion: number;
  Changelist: number;
  FriendlyName: string;
  Timestamp: Date;
  bIsLive: boolean;
  bCompressed: boolean;
  DesiredDelayInSeconds: number;
  Checkpoints?: ReplayCheckpoint[];
  Events?: ReplayEvent[];
  DataChunks?: ReplayDataChunk[];
  Header: Uint8Array;
}

export type ReplayDataType = "EVENT" | "DATACHUNK" | "CHECKPOINT";

export interface ReplayDownloadConfig {
  /**
   * Which replay data types to download.
   * EVENT data contains basic information like eliminations, you will only need EVENT data for ThisNils/node-replay-reader.
   * DATACHUNK data contains information that is required for most parsing libraries.
   * CHECKPOINT data contains information that is pretty much only useful if you want to use the replay ingame.
   * By default, only events and data chunks are downloaded
   */
  dataTypes: ReplayDataType[];

  /**
   * Whether a placeholder for AthenaMatchStats and AthenaMatchTeamStats should be added.
   * Required if you want to use the replay ingame, otherwise useless.
   * By default, this is set to false
   */
  addStatsPlaceholder: boolean;
}

export interface ReplayDownloadOptions extends Partial<ReplayDownloadConfig> {}

export interface EventTokensResponse {
  user: User;
  tokens: string[];
}

export interface BRAccountLevel {
  level: number;
  progress: number;
}

export interface BRAccountLevelData {
  user: User;
  level: BRAccountLevel;
}

export interface TournamentSessionMetadata {
  changelist: number;
  checkpoints: ReplayCheckpoint[];
  dataChunks: ReplayDataChunk[];
  desiredDelayInSeconds: number;
  events: ReplayEvent[];
  friendlyName: string;
  lengthInMS: number;
  networkVersion: number;
  replayName: string;
  timestamp: Date;
  isCompressed: boolean;
  isLive: boolean;
}

export interface STWFORTStats {
  fortitude: number;
  resistance: number;
  offense: number;
  tech: number;
}

export type STWSurvivorType = "special" | "manager" | "basic";

export type STWItemRarity = "c" | "uc" | "r" | "vr" | "sr" | "ur";

export type STWItemTier = 1 | 2 | 3 | 4 | 5 | 6;

export type STWSurvivorGender = "male" | "female";

export interface STWSurvivorSquads {
  trainingteam: STWSurvivor[];
  fireteamalpha: STWSurvivor[];
  closeassaultsquad: STWSurvivor[];
  thethinktank: STWSurvivor[];
  emtsquad: STWSurvivor[];
  corpsofengineering: STWSurvivor[];
  scoutingparty: STWSurvivor[];
  gadgeteers: STWSurvivor[];
}

export type STWSurvivorSquadType =
  | "medicine"
  | "arms"
  | "synthesis"
  | "scavenging";

export interface STWSurvivorSquadData {
  id: string;
  name: keyof STWSurvivorSquads;
  type: STWSurvivorSquadType;
  slotIdx: number;
}

export interface STWStatsNodeCostsData {
  [key: string]: {
    [key: string]: number;
  };
}

export interface STWStatsSTWLoadoutData {
  selectedHeroLoadout: string;
  modeLoadouts: string[];
  activeLoadoutIndex: number;
}

export interface STWStatsBRLoadoutData {
  loadouts: string[];
  lastAppliedLoadout: string;
  useRandomLoadout: boolean;
}

export interface STWStatsMissionAlertRedemptionData {
  missionAlertId: string;
  redemptionDateUtc: Date;
  evictClaimDataAfterUtc: Date;
}

export interface STWStatsQuestData {
  dailyLoginInterval: Date;
  dailyQuestRerolls?: number;
  poolStats: {
    stats: {
      poolName: string;
      nextRefresh: Date;
      rerollsRemaining: number;
      questHistory: string[];
    }[];
    dailyLoginInterval: Date;
    lockouts: {
      lockoutName: string;
    }[];
  };
}

export interface STWStatsGameplayStatData {
  statName: string;
  statValue: number;
}

export interface STWStatsClientSettingsData {
  pinnedQuestInstances?: any[];
}

export interface STWStatsResearchLevelsData {
  technology: number;
  offense: number;
  fortitude: number;
  resistance: number;
}

export interface STWStatsEventCurrencyData {
  templateId: string;
  cf: number;
}

export interface STWStatsXPData {
  total: number;
  overflow: number;
  lost: number;
}

export interface STWStatsDailyRewardsData {
  nextDefaultReward: number;
  totalDaysLoggedIn: number;
  lastClaimDate: Date;
  additionalSchedules?: {
    [key: string]: {
      rewardsClaimed: number;
      claimedToday: boolean;
    };
  };
}

export interface STWLockerSlotsData {
  Pickaxe: STWProfileLockerSlotData;
  MusicPack?: STWProfileLockerSlotData;
  Character?: STWProfileLockerSlotData;
  ItemWrap: STWProfileLockerSlotData;
  Backpack: STWProfileLockerSlotData;
  Dance: STWProfileLockerSlotData;
  LoadingScreen: STWProfileLockerSlotData;
}

export interface STWLockerBannerData {
  icon: string;
  color: string;
}

export type STWHeroType = "commando" | "constructor" | "outlander" | "ninja";

export type STWSchematicType = "ranged" | "melee" | "trap" | "other";

export type STWSchematicRangedSubType =
  | "assault"
  | "launcher"
  | "pistol"
  | "shotgun"
  | "smg"
  | "sniper";

export type STWSchematicMeleeSubType =
  | "blunt"
  | "blunt_hammer"
  | "edged_axe"
  | "edged_scythe"
  | "edged_sword"
  | "piercing_spear";

export type STWSchematicTrapSubType = "ceiling" | "floor" | "wall";

export type STWSchematicSubType =
  | STWSchematicRangedSubType
  | STWSchematicMeleeSubType
  | STWSchematicTrapSubType;

export type STWSchematicAlterationRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type STWSchematicEvoType = "ore" | "crystal";

export interface StatsLevelData {
  [key: string]: {
    level: number;
    progress: number;
  };
}

export interface ArenaDivisionData {
  [key: string]: number;
}

export interface NewsMessageVideoData {
  videoAutoplay: boolean;
  videoFullscreen: boolean;
  videoLoop: boolean;
  videoMute: boolean;
  videoStreamingEnabled: boolean;
  videoVideoString: string;
  videoUID: string;
}

export interface NewsMessagePlaylist {
  id: string;
}

export interface NewsMessageOffer {
  id: string;
  action: string;
}

export interface ImageData {
  url: string;
  width?: number;
  height?: number;
}

export interface STWWorldInfoData {
  theaters: STWTheaterData[];
  missions: STWMissionData[];
  missionAlerts: STWMissionAlertData[];
}

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */

export interface AuthData {
  access_token: string;
  account_id: string;
  client_id: string;
  expires_at: string;
  expires_in: number;
  token_type: string;
}

export interface LauncherAuthData extends AuthData {
  refresh_expires: number;
  refresh_expires_at: string;
  refresh_token: string;
  internal_client: boolean;
  client_service: string;
  scope: string[];
  displayName: string;
  app: string;
  in_app_id: string;
}

export interface FortniteAuthData extends AuthData {
  refresh_expires: number;
  refresh_expires_at: string;
  refresh_token: string;
  internal_client: boolean;
  client_service: string;
  displayName: string;
  app: string;
  in_app_id: string;
  device_id: string;
}

export interface FortniteClientCredentialsAuthData extends AuthData {
  internal_client: boolean;
  client_service: string;
  product_id: string;
  application_id: string;
}

export interface EOSAuthData extends AuthData {
  refresh_expires: number;
  refresh_expires_at: string;
  refresh_token: string;
  application_id: string;
  merged_accounts: string[];
  scope: string;
}

export interface EOSTokenInfo {
  active: boolean;
}

export interface AuthSessionStore<K, V> extends Collection<K, V> {
  get(key: AuthSessionStoreKey.Fortnite): FortniteAuthSession | undefined;
  get(key: AuthSessionStoreKey.Launcher): LauncherAuthSession | undefined;
  get(key: AuthSessionStoreKey.FortniteEOS): EOSAuthSession | undefined;
  get(
    key: AuthSessionStoreKey.FortniteClientCredentials,
  ): FortniteClientCredentialsAuthSession | undefined;
  get(key: K): V | undefined;
}

/* ------------------------------------------------------------------------------ */
/*                                    EOS CHAT                                    */
/* ------------------------------------------------------------------------------ */

/**
 * Represents a chat message data
 */
export interface ChatMessagePayload {
  /**
   * The message body, should not be empty and not exceed the limit of 2048 characters. Please note that emojis count as 2 characters.
   */
  body: string;
}

/* --------------------------------------------------------------------------------------- */
/*                                    EOS Connect STOMP                                    */
/* --------------------------------------------------------------------------------------- */
interface BaseEOSConnectMessage {
  correlationId: string;
  timestamp: number; // unix
  id?: string;
  connectionId?: string;
}

export interface EOSConnectCoreConnected extends BaseEOSConnectMessage {
  type: "core.connect.v1.connected";
}

export interface EOSConnectCoreConnectFailed extends BaseEOSConnectMessage {
  message: string;
  statusCode: number; // i.e. 4005
  type: "core.connect.v1.connect-failed";
}

export interface EOSConnectChatMemberLeftMessage extends BaseEOSConnectMessage {
  payload: {
    // deployment id
    namespace: string;
    conversationId: string;
    members: string[];
  };
  type: "social.chat.v1.MEMBERS_LEFT";
}

export interface EOSConnectChatNewMsgMessage extends BaseEOSConnectMessage {
  payload: {
    // deployment id
    namespace: string;
    conversation: {
      conversationId: string;
      type: string; // i.e. 'party'
    };
    message: {
      body: string;
      senderId: string;
      time: number;
    };
  };
  type: "social.chat.v1.NEW_MESSAGE";
}

export interface EOSConnectChatConversionCreatedMessage
  extends BaseEOSConnectMessage {
  payload: {
    // deployment id
    namespace: string;
    conversationId: string;
    type: string; // i.e. 'party'
    members: string[];
  };
  type: "social.chat.v1.CONVERSATION_CREATED";
}

export interface EOSConnectChatNewWhisperMessage extends BaseEOSConnectMessage {
  payload: {
    // deployment id
    namespace: string;
    message: {
      body: string;
      senderId: string;
      time: number;
    };
  };
  type: "social.chat.v1.NEW_WHISPER";
}

export type EOSConnectMessage =
  // Core
  | EOSConnectCoreConnected
  | EOSConnectCoreConnectFailed
  // Social chat
  | EOSConnectChatConversionCreatedMessage
  | EOSConnectChatNewMsgMessage
  | EOSConnectChatMemberLeftMessage
  | EOSConnectChatNewWhisperMessage;

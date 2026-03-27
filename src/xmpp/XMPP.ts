/* eslint-disable max-len */
import crypto from "node:crypto";
import { createClient as createStanzaClient } from "stanza";
import type { Agent, Constants, Stanzas } from "stanza";
// @ts-ignore stanza/protocol is not in package exports
import type { StreamError } from "stanza/protocol";
import Base from "../Base.ts";
import Endpoints from "../resources/Endpoints.ts";
import PartyMessage from "../../src/structures/party/PartyMessage.ts";
import FriendPresence from "../../src/structures/friend/FriendPresence.ts";
import Friend from "../../src/structures/friend/Friend.ts";
import IncomingPendingFriend from "../../src/structures/friend/IncomingPendingFriend.ts";
import OutgoingPendingFriend from "../../src/structures/friend/OutgoingPendingFriend.ts";
import BlockedUser from "../../src/structures/user/BlockedUser.ts";
import Party from "../../src/structures/party/Party.ts";
import { createPartyInvitation } from "../util/Util.ts";
import ReceivedPartyInvitation from "../../src/structures/party/ReceivedPartyInvitation.ts";
import FriendNotFoundError from "../exceptions/FriendNotFoundError.ts";
import ClientPartyMember from "../../src/structures/party/ClientPartyMember.ts";
import PartyMember from "../../src/structures/party/PartyMember.ts";
import PartyMemberNotFoundError from "../exceptions/PartyMemberNotFoundError.ts";
import PartyMemberConfirmation from "../../src/structures/party/PartyMemberConfirmation.ts";
import ReceivedPartyJoinRequest from "../../src/structures/party/ReceivedPartyJoinRequest.ts";
import PresenceParty from "../../src/structures/party/PresenceParty.ts";
import ReceivedFriendMessage from "../../src/structures/friend/ReceivedFriendMessage.ts";
import PartyMemberMeta from "../../src/structures/party/PartyMemberMeta.ts";
import { AuthSessionStoreKey } from "../resources/enums.ts";
import AuthenticationMissingError from "../exceptions/AuthenticationMissingError.ts";
import XMPPConnectionTimeoutError from "../exceptions/XMPPConnectionTimeoutError.ts";
import XMPPConnectionError from "../exceptions/XMPPConnectionError.ts";
import type Client from "../Client.ts";

/**
 * Represents the client's XMPP manager
 * @private
 */
class XMPP extends Base {
  /**
   * XMPP agent
   */
  private connection?: Agent;

  /**
   * The amount of times the XMPP agent has tried to reconnect
   */
  private connectionRetryCount: number;

  /**
   * The time the XMPP agent connected at
   */
  private connectedAt?: number;

  /**
   * @param client The main client
   */
  constructor(client: Client) {
    super(client);

    this.connection = undefined;
    this.connectedAt = undefined;
    this.connectionRetryCount = 0;
  }

  /**
   * Whether the XMPP agent is connected
   */
  public get isConnected(): boolean {
    return !!this.connection && this.connection.sessionStarted;
  }

  /**
   * Returns the xmpp JID
   */
  public get JID(): string | undefined {
    return this.connection?.jid;
  }

  /**
   * Returns the xmpp resource
   */
  public get resource(): string | undefined {
    return this.connection?.config.resource;
  }

  /**
   * Connects the XMPP agent to Epicgames' XMPP servers
   * @param sendStatusWhenConnected Whether to send an empty status status when connected
   */
  public async connect(sendStatusWhenConnected: boolean = true): Promise<void> {
    if (!this.client.auth.sessions.has(AuthSessionStoreKey.Fortnite)) {
      throw new AuthenticationMissingError(AuthSessionStoreKey.Fortnite);
    }

    this.connection = createStanzaClient({
      jid: `${this.client.user.self!.id}@${Endpoints.EPIC_PROD_ENV}`,
      server: Endpoints.EPIC_PROD_ENV,
      transports: {
        websocket: `wss://${Endpoints.XMPP_SERVER}`,
        bosh: false,
      },
      credentials: {
        host: Endpoints.EPIC_PROD_ENV,
        username: this.client.user.self!.id,
        password: this.client.auth.sessions.get(AuthSessionStoreKey.Fortnite)!
          .accessToken,
      },
      resource: `V2:Fortnite:${this.client.config.platform}::${
        crypto
          .randomBytes(16)
          .toString("hex")
          .toUpperCase()
      }`,
    });

    this.connection.enableKeepAlive({
      interval: this.client.config.xmppKeepAliveInterval,
    });

    this.setupEvents();

    this.client.debug("[XMPP] Connecting...");
    const connectionStartTime = Date.now();

    return new Promise<void>((res, rej) => {
      const timeout = setTimeout(() => {
        rej(
          new XMPPConnectionTimeoutError(
            this.client.config.xmppConnectionTimeout,
          ),
        );
      }, this.client.config.xmppConnectionTimeout);

      this.connection!.once("session:started", () => {
        clearTimeout(timeout);
        this.client.debug(
          `[XMPP] Successfully connected (${
            (
              (Date.now() - connectionStartTime) /
              1000
            ).toFixed(2)
          }s)`,
        );
        this.connectionRetryCount = 0;

        this.connectedAt = Date.now();

        if (sendStatusWhenConnected) this.sendStatus();

        res();
      });

      this.connection?.once("stream:error", (err: StreamError) => {
        clearTimeout(timeout);
        rej(new XMPPConnectionError(err));
      });

      this.connection!.connect();
    });
  }

  /**
   * Disconnects the XMPP client.
   * Also performs a cleanup
   */
  public disconnect() {
    if (!this.connection) return;

    this.connection.disableKeepAlive();
    this.connection.removeAllListeners();
    this.connection.disconnect();
    this.connection = undefined;

    this.client.debug("[XMPP] Disconnected");
  }

  /**
   * Registers all events
   */
  private setupEvents() {
    this.connection!.on("disconnected", async () => {
      this.disconnect();

      if (
        this.connectionRetryCount < this.client.config.xmppMaxConnectionRetries
      ) {
        this.client.debug("[XMPP] Disconnected, reconnecting in 5 seconds...");
        this.connectionRetryCount += 1;

        await new Promise((res) => this.client.setTimeout(res, 5000));

        await this.connect();
        if (this.client.config.fetchFriends) await this.client.updateCaches();
        if (!this.client.config.disablePartyService) {
          await this.client.initParty(
            this.client.config.createParty,
            this.client.config.forceNewParty,
          );
        }
      } else {
        this.client.debug("[XMPP] Disconnected, retry limit reached");

        await this.client.logout();
      }
    });

    this.connection!.on(
      "raw:incoming",
      (raw: unknown) => this.client.debug(`IN ${raw}`, "xmpp"),
    );
    this.connection!.on(
      "raw:outgoing",
      (raw: unknown) => this.client.debug(`OUT ${raw}`, "xmpp"),
    );

    this.connection!.on("groupchat", async (m) => {
      try {
        await this.client.partyLock.wait();

        const partyId = m.from.split("@")[0].replace("Party-", "");
        if (!this.client.party || this.client.party.id !== partyId) return;
        if (m.body === "Welcome! You created new Multi User Chat Room.") return;

        const [, authorId] = m.from.split(":");
        if (authorId === this.client.user.self!.id) return;

        const authorMember = this.client.party.members.get(authorId);
        if (!authorMember) return;

        const partyMessage = new PartyMessage(this.client, {
          content: m.body ?? "",
          author: authorMember,
          sentAt: new Date(),
          id: m.id as string,
          party: this.client.party,
        });

        this.client.dispatchEvent(
          this.client.createEvent("party:member:message", {
            message: partyMessage,
          }),
        );
      } catch (err: any) {
        this.client.debug(
          `[XMPP] Error while processing party chat message: ${err.name} - ${err.message}`,
        );
        this.client.dispatchEvent(
          this.client.createEvent("xmpp:chat:error", { error: err }),
        );
      }
    });

    this.connection!.on("chat", async (m) => {
      try {
        const friend = await this.waitForFriend(m.from.split("@")[0]);
        if (!friend) return;
        const message = new ReceivedFriendMessage(this.client, {
          content: m.body || "",
          author: friend,
          id: m.id as string,
          sentAt: new Date(),
        });

        this.client.dispatchEvent(
          this.client.createEvent("friend:message", { message }),
        );
      } catch (err: any) {
        this.client.debug(
          `[XMPP] Error while processing friend whisper message: ${err.name} - ${err.message}`,
        );
        this.client.dispatchEvent(
          this.client.createEvent("xmpp:chat:error", { error: err }),
        );
      }
    });

    this.connection!.on("presence", async (p) => {
      try {
        await this.client.cacheLock.wait();
        if (!p.status) return;

        const friendId = p.from.split("@")[0];
        if (friendId === this.client.user.self!.id) return;

        const friend = await this.waitForFriend(friendId);
        if (!friend) return;

        if (p.type === "unavailable") {
          friend.lastAvailableTimestamp = undefined;
          friend.party = undefined;

          this.client.dispatchEvent(
            this.client.createEvent("friend:offline", { friend }),
          );
          return;
        }

        const wasUnavailable = !friend.lastAvailableTimestamp;
        friend.lastAvailableTimestamp = Date.now();

        const presence = JSON.parse(p.status);

        const before = this.client.friend.list.get(friendId)?.presence;
        const after = new FriendPresence(
          this.client,
          presence,
          friend,
          p.show || "online",
          p.from,
        );
        if (
          (this.client.config.cacheSettings.presences?.maxLifetime || 0) > 0
        ) {
          friend.presence = after;
        }

        if (presence.Properties?.["party.joininfodata.286331153_j"]) {
          friend.party = new PresenceParty(
            this.client,
            presence.Properties["party.joininfodata.286331153_j"],
          );
        }

        if (
          wasUnavailable &&
          this.connectedAt &&
          this.connectedAt > this.client.config.friendOnlineConnectionTimeout
        ) {
          this.client.dispatchEvent(
            this.client.createEvent("friend:online", { friend }),
          );
        }

        this.client.dispatchEvent(
          this.client.createEvent("friend:presence", {
            prev: before,
            next: after,
          }),
        );
      } catch (err: any) {
        this.client.debug(
          `[XMPP] Error while processing presence: ${err.name} - ${err.message}`,
        );
        this.client.dispatchEvent(
          this.client.createEvent("xmpp:message:error", { error: err }),
        );
      }
    });

    this.connection!.on("message", async (m) => {
      if (m.type && m.type !== "normal") return;
      if (!m.body) return;
      if (m.from !== "xmpp-admin@prod.ol.epicgames.com") return;

      let body: any;
      try {
        body = JSON.parse(m.body);
      } catch {
        return;
      }

      if (!body.type) return;

      try {
        switch (body.type) {
          case "com.epicgames.friends.core.apiobjects.Friend":
            {
              const {
                payload: { status, accountId, favorite, created, direction },
              } = body;

              const user = await this.client.user.fetch(accountId);
              if (!user) break;

              if (status === "ACCEPTED") {
                const friend = new Friend(this.client, {
                  displayName: user.displayName,
                  id: user.id,
                  externalAuths: user.externalAuths,
                  favorite,
                  created,
                  alias: "",
                  note: "",
                });

                this.client.friend.list.set(friend.id, friend);
                this.client.friend.pendingList.delete(friend.id);

                this.client.dispatchEvent(
                  this.client.createEvent("friend:added", { friend }),
                );
              } else if (status === "PENDING") {
                if (direction === "INBOUND") {
                  const pendingFriend = new IncomingPendingFriend(this.client, {
                    accountId: user.id,
                    // Type casting is fine here because the lookup by id always returns external auths
                    displayName: user.displayName as string,
                    created,
                    favorite,
                  });

                  this.client.friend.pendingList.set(
                    pendingFriend.id,
                    pendingFriend,
                  );
                  this.client.dispatchEvent(
                    this.client.createEvent("friend:request", {
                      pendingFriend,
                    }),
                  );
                } else if (direction === "OUTBOUND") {
                  const pendingFriend = new OutgoingPendingFriend(this.client, {
                    accountId: user.id,
                    // Type casting is fine here because the lookup by id always returns external auths
                    displayName: user.displayName as string,
                    created,
                    favorite,
                  });

                  this.client.friend.pendingList.set(
                    pendingFriend.id,
                    pendingFriend,
                  );
                  this.client.dispatchEvent(
                    this.client.createEvent("friend:request:sent", {
                      pendingFriend,
                    }),
                  );
                }
              }
            }
            break;

          case "FRIENDSHIP_REMOVE":
            {
              const { from, to, reason } = body;
              const accountId = from === this.client.user.self!.id ? to : from;

              if (reason === "ABORTED") {
                const pendingFriend = this.client.friend.pendingList.get(
                  accountId,
                );
                if (!pendingFriend) break;

                this.client.friend.pendingList.delete(pendingFriend.id);
                this.client.dispatchEvent(
                  this.client.createEvent("friend:request:aborted", {
                    pendingFriend,
                  }),
                );
              } else if (reason === "REJECTED") {
                const pendingFriend = this.client.friend.pendingList.get(
                  accountId,
                );
                if (!pendingFriend) break;

                this.client.friend.pendingList.delete(pendingFriend.id);
                this.client.dispatchEvent(
                  this.client.createEvent("friend:request:declined", {
                    pendingFriend,
                  }),
                );
              } else if (reason === "DELETED") {
                const friend = await this.waitForFriend(accountId);
                if (!friend) break;

                this.client.friend.list.delete(friend.id);
                this.client.dispatchEvent(
                  this.client.createEvent("friend:removed", { friend }),
                );
              }
            }
            break;

          case "USER_BLOCKLIST_UPDATE":
            {
              const { status, accountId } = body;

              if (status === "BLOCKED") {
                const user = await this.client.user.fetch(accountId);
                if (!user) break;

                const blockedUser = new BlockedUser(this.client, user);

                this.client.user.blocklist.set(user.id, blockedUser);
                this.client.dispatchEvent(
                  this.client.createEvent("user:blocked", { blockedUser }),
                );
              } else if (status === "UNBLOCKED") {
                const blockedUser = this.client.user.blocklist.get(accountId);
                if (!blockedUser) break;

                this.client.user.blocklist.delete(blockedUser.id);
                this.client.dispatchEvent(
                  this.client.createEvent("user:unblocked", { blockedUser }),
                );
              }
            }
            break;

          case "com.epicgames.social.party.notification.v0.PING":
            {
              if (this.client.config.disablePartyService) break;
              if (this.client.listenerCount("party:invite") === 0) break;

              const pingerId = body.pinger_id;

              const friend = await this.waitForFriend(pingerId);
              if (!friend) throw new FriendNotFoundError(pingerId);

              const data = await this.client.http.epicgamesRequest(
                {
                  method: "GET",
                  url: `${Endpoints.BR_PARTY}/user/${
                    this.client.user.self!.id
                  }/pings/${pingerId}/parties`,
                },
                AuthSessionStoreKey.Fortnite,
              );

              if (!data[0]) {
                this.client.debug(
                  `[XMPP] Error while processing ${body.type}: Could't find an active invitation`,
                );
                break;
              }

              const [partyData] = data;
              let party: Party;

              if (partyData.config.discoverability === "ALL") {
                party = (await this.client.getParty(partyData.id)) as Party;
              } else party = new Party(this.client, partyData);

              if (party.members.some((pm: PartyMember) => !pm.displayName)) {
                await party.updateMemberBasicInfo();
              }

              let invitation = partyData.invites.find(
                (i: Record<string, unknown>) =>
                  i.sent_by === pingerId && i.status === "SENT",
              );
              if (!invitation) {
                invitation = createPartyInvitation(
                  this.client.user.self!.id,
                  pingerId,
                  { ...body, ...partyData },
                );
              }

              const invite = new ReceivedPartyInvitation(
                this.client,
                party,
                friend,
                this.client.user.self!,
                invitation,
              );
              this.client.dispatchEvent(
                this.client.createEvent("party:invite", { invitation: invite }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_JOINED":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                break;
              }

              const memberId = body.account_id;

              if (memberId === this.client.user.self!.id) {
                if (!this.client.party.me) {
                  this.client.party.members.set(
                    memberId,
                    new ClientPartyMember(this.client.party, body),
                  );
                }
                await this.client.party.me.sendPatch(
                  this.client.party.me.meta.schema,
                );
              } else {
                this.client.party.members.set(
                  memberId,
                  new PartyMember(this.client.party, body),
                );
              }

              const member = this.client.party.members.get(memberId);
              if (!member) break;
              if (!member.displayName) await member.fetch();

              this.client.setStatus();
              if (this.client.party.me.isLeader) {
                await this.client.party.refreshSquadAssignments();
              }

              try {
                await this.client.waitForEvent(
                  "party:member:updated",
                  2000,
                  (dt) => dt.member.id === member.id,
                );
              } catch {
                // ignore. meta will be partly undefined, but usually, if this takes longer than 2 seconds, something else went wrong
              }
              this.client.dispatchEvent(
                this.client.createEvent("party:member:joined", { member }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_STATE_UPDATED":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                return;
              }

              const memberId = body.account_id;
              const member = this.client.party.members.get(memberId);
              if (!member) throw new PartyMemberNotFoundError(memberId);

              if (member.receivedInitialStateUpdate) {
                const newMeta = new PartyMemberMeta({ ...member.meta.schema });
                newMeta.update(body.member_state_updated, true);

                if (newMeta.outfit !== member.meta.outfit) {
                  this.client.dispatchEvent(
                    this.client.createEvent("party:member:outfit:updated", {
                      member,
                      prev: member.meta.outfit,
                      next: newMeta.outfit,
                    }),
                  );
                }

                if (newMeta.backpack !== member.meta.backpack) {
                  this.client.dispatchEvent(
                    this.client.createEvent("party:member:backpack:updated", {
                      member,
                      prev: member.meta.backpack,
                      next: newMeta.backpack,
                    }),
                  );
                }

                if (newMeta.pickaxe !== member.meta.pickaxe) {
                  this.client.dispatchEvent(
                    this.client.createEvent("party:member:pickaxe:updated", {
                      member,
                      prev: member.meta.pickaxe,
                      next: newMeta.pickaxe,
                    }),
                  );
                }

                if (newMeta.emote !== member.meta.emote) {
                  this.client.dispatchEvent(
                    this.client.createEvent("party:member:emote:updated", {
                      member,
                      prev: member.meta.emote,
                      next: newMeta.emote,
                    }),
                  );
                }

                if (newMeta.isReady !== member.meta.isReady) {
                  this.client.dispatchEvent(
                    this.client.createEvent("party:member:readiness:updated", {
                      member,
                      prev: member.meta.isReady,
                      next: newMeta.isReady,
                    }),
                  );
                }

                if (
                  JSON.stringify(newMeta.match) !==
                    JSON.stringify(member.meta.match)
                ) {
                  this.client.dispatchEvent(
                    this.client.createEvent("party:member:matchstate:updated", {
                      member,
                      prev: member.meta.match,
                      next: newMeta.match,
                    }),
                  );
                }
              }

              member.updateData(body);
              member.receivedInitialStateUpdate = true;
              this.client.dispatchEvent(
                this.client.createEvent("party:member:updated", {
                  member,
                }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_LEFT":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                break;
              }

              const memberId = body.account_id;
              const member = this.client.party.members.get(memberId);
              if (!member) {
                if (
                  this.client.party.pendingMemberConfirmations.has(memberId)
                ) {
                  this.client.party.pendingMemberConfirmations.delete(memberId);
                  break;
                }

                throw new PartyMemberNotFoundError(memberId);
              }

              if (memberId === this.client.user.self!.id) {
                await this.client.initParty(true, false);
                break;
              }

              this.client.party.members.delete(member.id);
              this.client.setStatus();
              if (this.client.party.me.isLeader) {
                await this.client.party.refreshSquadAssignments();
              }

              this.client.dispatchEvent(
                this.client.createEvent("party:member:left", { member }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_EXPIRED":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id ||
                body.account_id === this.client.user.self!.id
              ) {
                break;
              }

              const memberId = body.account_id;
              const member = this.client.party.members.get(memberId);
              if (!member) return;

              this.client.party.members.delete(member.id);
              this.client.setStatus();
              if (this.client.party.me.isLeader) {
                await this.client.party.refreshSquadAssignments();
              }

              this.client.dispatchEvent(
                this.client.createEvent("party:member:expired", { member }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_KICKED":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                break;
              }

              const memberId = body.account_id;
              const member = this.client.party.members.get(memberId);
              if (!member) throw new PartyMemberNotFoundError(memberId);

              if (member.id === this.client.user.self!.id) {
                this.client.party = undefined;
                await this.client.initParty(true, false);
              } else {
                this.client.party.members.delete(member.id);
                this.client.setStatus();
                if (this.client.party.me.isLeader) {
                  await this.client.party.refreshSquadAssignments();
                }
              }
              this.client.dispatchEvent(
                this.client.createEvent("party:member:kicked", { member }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_DISCONNECTED":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                break;
              }

              const memberId = body.account_id;
              const member = this.client.party.members.get(memberId);
              if (!member) throw new PartyMemberNotFoundError(memberId);

              this.client.party.members.delete(member.id);
              this.client.setStatus();
              if (this.client.party.me.isLeader) {
                await this.client.party.refreshSquadAssignments();
              }
              this.client.dispatchEvent(
                this.client.createEvent("party:member:disconnected", {
                  member,
                }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                break;
              }

              if (this.client.party.leader) this.client.party.leader.role = "";

              const memberId = body.account_id;
              const member = this.client.party.members.get(memberId);
              if (!member) throw new PartyMemberNotFoundError(memberId);

              member.role = "CAPTAIN";
              this.client.setStatus();
              this.client.dispatchEvent(
                this.client.createEvent("party:member:promoted", { member }),
              );
            }
            break;

          case "com.epicgames.social.party.notification.v0.PARTY_UPDATED":
            if (this.client.config.disablePartyService) break;
            await this.client.partyLock.wait();
            if (!this.client.party || this.client.party.id !== body.party_id) {
              break;
            }

            this.client.party.updateData(body);
            this.client.setStatus();

            this.client.dispatchEvent(
              this.client.createEvent("party:updated", {
                party: this.client.party,
              }),
            );
            break;

          case "com.epicgames.social.party.notification.v0.MEMBER_REQUIRE_CONFIRMATION":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                break;
              }

              const user = await this.client.user.fetch(body.account_id);
              if (!user) break;

              const confirmation = new PartyMemberConfirmation(
                this.client,
                this.client.party,
                user,
                body,
              );
              this.client.party.pendingMemberConfirmations.set(
                user.id,
                confirmation,
              );

              if (this.client.listenerCount("party:member:confirmation") > 0) {
                this.client.dispatchEvent(
                  this.client.createEvent("party:member:confirmation", {
                    confirmation,
                  }),
                );
              } else {
                await confirmation.confirm();
              }
            }
            break;

          case "com.epicgames.social.party.notification.v0.INITIAL_INTENTION":
            {
              if (this.client.config.disablePartyService) break;
              await this.client.partyLock.wait();
              if (
                !this.client.party ||
                this.client.party.id !== body.party_id
              ) {
                break;
              }

              const friend = await this.waitForFriend(body.requester_id);
              if (!friend) throw new FriendNotFoundError(body.requester_id);

              const request = new ReceivedPartyJoinRequest(
                this.client,
                friend,
                this.client.user.self!,
                body,
              );

              this.client.dispatchEvent(
                this.client.createEvent("party:joinrequest", { request }),
              );
            }
            break;
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));

        this.client.debug(
          `[XMPP] Error while processing ${body.type}: ${error.name} - ${error.message}`,
        );
        this.client.dispatchEvent(
          this.client.createEvent("xmpp:message:error", { error }),
        );
      }
    });
  }

  /**
   * Waits for a friend to be added to the clients cache
   */

  private async waitForFriend(id: string) {
    const cachedFriend = this.client.friend.list.get(id);
    if (cachedFriend) return cachedFriend;

    try {
      const detail = await this.client.waitForEvent(
        "friend:added",
        5000,
        (dt) => dt.friend.id === id,
      );
      return detail.friend;
    } catch {
      return undefined;
    }
  }

  /**
   * Sends a presence to all or a specific friend
   * @param status The status message. Can be undefined if you want to reset it
   * @param show The show type of the presence (eg "away")
   * @param to The JID of a specific friend
   */
  public sendStatus(
    status?: object | string,
    show?: Constants.PresenceShow,
    to?: string,
  ) {
    if (!status) {
      this.connection!.sendPresence();
      return;
    }

    this.connection!.sendPresence({
      status: JSON.stringify(
        typeof status === "string" ? { Status: status } : status,
      ),
      to,
      show,
    });
  }
}

export default XMPP;

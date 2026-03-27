import PartyPermissionError from "../../exceptions/PartyPermissionError.ts";
import PartyMemberMeta from "./PartyMemberMeta.ts";
import User from "../user/User.ts";
import type Party from "./Party.ts";
import type ClientParty from "./ClientParty.ts";
import type {
  BannerMeta,
  BattlePassMeta,
  CosmeticsVariantMeta,
  MatchMeta,
  PartyMemberData,
  PartyMemberIsland,
  PartyMemberSchema,
  PartyMemberUpdateData,
  Platform,
} from "../../resources/structs.ts";

/**
 * Represents a party member
 */
class PartyMember extends User {
  /**
   * The member's role. "CAPTAIN" means leader
   */
  public role: string;

  /**
   * The date when this member joined the party
   */
  public joinedAt: Date;

  /**
   * The member's meta
   */
  public meta: PartyMemberMeta;

  /**
   * The party this member belongs to
   */
  public party: Party | ClientParty;

  /**
   * The member's revision
   */
  public revision: number;

  /**
   * Whether this member has received an initial state update
   */
  public receivedInitialStateUpdate: boolean;

  /**
   * @param party The party this member belongs to
   * @param data The member's data
   */
  constructor(party: Party | ClientParty, data: PartyMemberData) {
    super(party.client, {
      ...data,
      displayName: data.account_dn,
      id: data.account_id,
    });

    this.party = party;
    this.role = data.role;
    this.joinedAt = new Date(data.joined_at);
    this.meta = new PartyMemberMeta(data.meta);
    this.revision = data.revision;
    this.receivedInitialStateUpdate = false;
  }

  /**
   * Whether this member is the leader of the party
   */
  public get isLeader(): boolean {
    return this.role === "CAPTAIN";
  }

  /**
   * The member's currently equipped outfit CID
   */
  public get outfit(): string | undefined {
    return this.meta.outfit;
  }

  /**
   * The member's currently equipped pickaxe ID
   */
  public get pickaxe(): string | undefined {
    return this.meta.pickaxe;
  }

  /**
   * The member's current emote EID
   */
  public get emote(): string | undefined {
    return this.meta.emote;
  }

  /**
   * The member's currently equipped backpack BID
   */
  public get backpack(): string | undefined {
    return this.meta.backpack;
  }

  /**
   * The member's currently equipped shoes
   */
  public get shoes(): string | undefined {
    return this.meta.shoes;
  }

  /**
   * Whether the member is ready
   */
  public get isReady(): boolean {
    return this.meta.isReady;
  }

  /**
   * Whether the member is sitting out
   */
  public get isSittingOut(): boolean {
    return this.meta.isSittingOut;
  }

  /**
   * The member's current input method
   */
  public get inputMethod(): string | undefined {
    return this.meta.input;
  }

  /**
   * The member's cosmetic variants
   */
  public get variants(): CosmeticsVariantMeta {
    return this.meta.variants;
  }

  /**
   * The member's custom data store
   */
  public get customDataStore(): string[] {
    return this.meta.customDataStore;
  }

  /**
   * The member's banner info
   */
  public get banner(): BannerMeta | undefined {
    return this.meta.banner;
  }

  /**
   * The member's battlepass info
   */
  public get battlepass(): BattlePassMeta | undefined {
    return this.meta.battlepass;
  }

  /**
   * The member's platform
   */
  public get platform(): Platform | undefined {
    return this.meta.platform;
  }

  /**
   * The member's match info
   */
  public get matchInfo(): MatchMeta {
    return this.meta.match;
  }

  /**
   * The member's current playlist
   */
  public get playlist(): PartyMemberIsland {
    return this.meta.island;
  }

  /**
   * Whether a marker has been set
   */
  public get isMarkerSet(): boolean {
    return this.meta.isMarkerSet;
  }

  /**
   * The member's marker location [x, y] tuple.
   * [0, 0] if there is no marker set
   */
  public get markerLocation(): [number, number] {
    return this.meta.markerLocation;
  }

  /**
   * Kicks this member from the client's party.
   * @throws {PartyPermissionError} The client is not a member or not the leader of the party
   */
  public kick(): Promise<any> {
    // This is a very hacky solution, but it's required since we cannot import ClientParty (circular dependencies)
    if (typeof (this.party as any).kick !== "function") {
      throw new PartyPermissionError();
    }
    return (this.party as any).kick(this.id);
  }

  /**
   * Promotes this member
   * @throws {PartyPermissionError} The client is not a member or not the leader of the party
   */
  public promote(): Promise<any> {
    // This is a very hacky solution, but it's required since we cannot import ClientParty (circular dependencies)
    if (typeof (this.party as any).promote !== "function") {
      throw new PartyPermissionError();
    }
    return (this.party as any).promote(this.id);
  }

  /**
   * Hides this member
   * @param hide Whether the member should be hidden
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {EpicgamesAPIError}
   */
  public hide(hide = true): Promise<any> {
    // This is a very hacky solution, but it's required since we cannot import ClientParty (circular dependencies)
    if (typeof (this.party as any).hideMember !== "function") {
      throw new PartyPermissionError();
    }
    return (this.party as any).hideMember(this.id, hide);
  }

  /**
   * Bans this member from the client's party.
   */
  public chatBan(): Promise<any> {
    // This is a very hacky solution, but it's required since we cannot import ClientParty (circular dependencies)
    if (typeof (this.party as any).chatBan !== "function") {
      throw new PartyPermissionError();
    }
    return (this.party as any).chatBan(this.id);
  }

  /**
   * Updates this members data
   * @param data The update data
   */
  public updateData(data: PartyMemberUpdateData) {
    if (data.revision > this.revision) this.revision = data.revision;
    if (data.account_dn !== this.displayName) {
      this.update({
        id: this.id,
        displayName: data.account_dn,
        externalAuths: this.externalAuths,
      });
    }

    this.meta.update(data.member_state_updated, true);
    this.meta.remove(data.member_state_removed as (keyof PartyMemberSchema)[]);
  }

  /**
   * Converts this party member into an object
   */
  public override toObject(): PartyMemberData {
    return {
      id: this.id,
      account_id: this.id,
      joined_at: this.joinedAt.toISOString(),
      updated_at: new Date().toISOString(),
      meta: this.meta.schema,
      revision: 0,
      role: this.role,
      account_dn: this.displayName,
    };
  }
}

export default PartyMember;

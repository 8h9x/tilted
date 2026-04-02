import { AsyncQueue } from "@sapphire/async-queue";
import Endpoints from "../../resources/Endpoints.ts";
import ClientPartyMemberMeta from "./ClientPartyMemberMeta.ts";
import PartyMember from "./PartyMember.ts";
import { AuthSessionStoreKey } from "../../resources/enums.ts";
import EpicgamesAPIError from "../../exceptions/EpicgamesAPIError.ts";
import type {
  CosmeticEnlightment,
  Cosmetics,
  CosmeticVariant,
  PartyMemberData,
  PartyMemberSchema,
} from "../../resources/structs.ts";
import type Party from "./Party.ts";

/**
 * Represents the client's party member
 */
class ClientPartyMember extends PartyMember {
  /**
   * The patch queue
   */
  private patchQueue: AsyncQueue;

  /**
   * The member's meta
   */
  public override meta: ClientPartyMemberMeta;

  /**
   * @param party The party this member belongs to
   * @param data The member data
   */
  constructor(party: Party, data: PartyMemberData) {
    super(party, data);

    this.meta = new ClientPartyMemberMeta(this, data.meta);
    this.patchQueue = new AsyncQueue();

    this.update({
      id: this.id,
      displayName: this.client.user.self!.displayName,
      externalAuths: this.client.user.self!.externalAuths,
    });

    if (this.client.lastPartyMemberMeta) {
      this.meta.update(this.client.lastPartyMemberMeta, true);
    }
  }

  /**
   * Sends a meta patch to Epicgames's servers
   * @param updated The updated schema
   * @throws {EpicgamesAPIError}
   */
  public async sendPatch(updated: PartyMemberSchema): Promise<void> {
    await this.patchQueue.wait();

    try {
      await this.client.http.epicgamesRequest(
        {
          method: "PATCH",
          url:
            `${Endpoints.BR_PARTY}/parties/${this.party.id}/members/${this.id}/meta`,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            delete: [],
            revision: this.revision,
            update: updated,
          }),
        },
        AuthSessionStoreKey.Fortnite,
      );
    } catch (e) {
      if (
        e instanceof EpicgamesAPIError &&
        e.code === "errors.com.epicgames.social.party.stale_revision"
      ) {
        this.revision = parseInt(e.messageVars[1], 10);
        this.patchQueue.shift();
        return this.sendPatch(updated);
      }

      this.patchQueue.shift();

      throw e;
    }

    this.revision += 1;
    this.patchQueue.shift();

    if (this.client.config.savePartyMemberMeta) {
      this.client.lastPartyMemberMeta = this.meta.schema;
    }

    return undefined;
  }

  /**
   * Merges partial updates into a single JSON meta key and sends the patch.
   * @param key The JSON schema key (must follow the "Default:InnerKey_j" convention)
   * @param updates Partial updates to merge into the inner object
   */
  private async patchMeta(
    key: keyof PartyMemberSchema,
    updates: Record<string, any>,
  ): Promise<void> {
    await this.sendPatch({
      [key]: this.meta.mergeInner(key, updates),
    } as PartyMemberSchema);
  }

  /**
   * Builds a game-files asset path for a given cosmetic ID.
   * @param id The cosmetic's ID
   * @param defaultPath The default directory path to use when no custom path is provided
   * @param customPath An optional custom directory path override
   */
  private static buildAssetPath(
    id: string,
    defaultPath: string,
    customPath?: string,
  ): string {
    return `${(customPath ?? defaultPath).replace(/\/$/, "")}/${id}.${id}`;
  }

  /**
   * Applies slot-level updates to MpLoadout1.s and sends the patch.
   * Pass `null` as a slot value to delete that slot (e.g. clearing a backpack).
   * @param sUpdates A map of slot keys to their new values (or null to remove)
   */
  private async patchMpLoadout1S(
    sUpdates: Record<string, any>,
  ): Promise<void> {
    const mpData = this.meta.get("Default:MpLoadout1_j") as any;
    const s: Record<string, any> = typeof mpData.MpLoadout1.s === "string"
      ? JSON.parse(mpData.MpLoadout1.s)
      : { ...mpData.MpLoadout1.s };

    for (const [key, value] of Object.entries(sUpdates)) {
      if (value === null) {
        delete s[key];
      } else {
        s[key] = value;
      }
    }

    await this.sendPatch({
      "Default:MpLoadout1_j": this.meta.set("Default:MpLoadout1_j", {
        ...mpData,
        MpLoadout1: { ...mpData.MpLoadout1, s },
      }),
    });
  }

  /**
   * Updates the client party member's readiness
   * @param ready Whether the client party member is ready
   * @throws {EpicgamesAPIError}
   */
  public async setReadiness(ready: boolean) {
    await this.patchMeta("Default:LobbyState_j", {
      gameReadiness: ready ? "Ready" : "NotReady",
      readyInputType: ready ? "MouseAndKeyboard" : "Count",
    });
  }

  /**
   * Updates the client party member's sitting out state
   * @param sittingOut Whether the client party member is sitting out
   * @throws {EpicgamesAPIError}
   */
  public async setSittingOut(sittingOut: boolean) {
    await this.patchMeta("Default:LobbyState_j", {
      gameReadiness: sittingOut ? "SittingOut" : "NotReady",
      readyInputType: "Count",
    });
  }

  /**
   * Updates the client party member's level
   * @param level The new level
   * @throws {EpicgamesAPIError}
   */
  public async setLevel(level: number) {
    await this.patchMeta("Default:BattlePassInfo_j", { passLevel: level });
  }

  /**
   * Updates the client party member's battle pass info
   * @param isPurchased Whether the battle pass is purchased
   * @param level The battle pass level
   * @param selfBoost The battle pass self boost percentage
   * @param friendBoost The battle pass friend boost percentage
   * @throws {EpicgamesAPIError}
   */
  public async setBattlePass(
    isPurchased: boolean,
    level: number,
    selfBoost: number,
    friendBoost: number,
  ) {
    await this.patchMeta("Default:BattlePassInfo_j", {
      bHasPurchasedPass: isPurchased,
      passLevel: level,
      selfBoostXp: selfBoost,
      friendBoostXp: friendBoost,
    });
  }

  /**
   * Updates the client party member's banner
   * @param bannerId The new banner's id
   * @param color The new banner's color
   * @throws {EpicgamesAPIError}
   */
  public async setBanner(bannerId: string, color: string) {
    await this.patchMpLoadout1S({
      li: { i: bannerId, v: [] },
      lc: { i: color, v: [] },
    });
  }

  /**
   * Updates multiple cosmetics for the client party member.
   * If a cosmetic is set to `undefined` or any falsy value, it will be cleared, if possible.
   * If a cosmetic is not provided, it will remain unchanged.
   * @param cosmetics An object specifying the cosmetics to update, including outfit, backpack, pickaxe and shoes.
   * @throws {EpicgamesAPIError}
   */
  public async setCosmetics(cosmetics: Cosmetics = {}): Promise<void> {
    const { outfit, backpack, pickaxe, shoes } = cosmetics;

    const mpData = this.meta.get("Default:MpLoadout1_j") as any;
    const s: Record<string, any> = typeof mpData.MpLoadout1.s === "string"
      ? JSON.parse(mpData.MpLoadout1.s)
      : { ...mpData.MpLoadout1.s };

    let changed = false;

    if (outfit) {
      s.ac = { i: outfit.id, v: outfit.variants?.map(() => 0) ?? [] };
      changed = true;
    }

    if (backpack) {
      s.ab = {
        i: backpack.id,
        v: backpack.variants?.map(() => 0) ?? [],
      };
      changed = true;
    }

    if (pickaxe) {
      s.ap = { i: pickaxe.id, v: pickaxe.variants?.map(() => 0) ?? [] };
      changed = true;
    }

    if (shoes) {
      s.as = { i: shoes.id, v: shoes.variants?.map(() => 0) ?? [] };
      changed = true;
    }

    if (!changed) return;

    await this.sendPatch({
      "Default:MpLoadout1_j": this.meta.set("Default:MpLoadout1_j", {
        ...mpData,
        MpLoadout1: { ...mpData.MpLoadout1, s },
      }),
    });
  }

  /**
   * Updates the client party member's outfit
   * @param id The outfit's ID
   * @param variants The outfit's variants
   * @param enlightment The outfit's enlightment
   * @throws {EpicgamesAPIError}
   */
  public setOutfit(
    id: string,
    variants: CosmeticVariant[] = [],
    enlightment?: CosmeticEnlightment,
  ): Promise<void> {
    return this.setCosmetics({ outfit: { id, variants, enlightment } });
  }

  /**
   * Updates the client party member's backpack
   * @param id The backpack's ID
   * @param variants The backpack's variants
   * @param path The backpack's path in the game files
   * @throws {EpicgamesAPIError}
   */
  public setBackpack(
    id: string,
    variants: CosmeticVariant[] = [],
    path?: string,
  ): Promise<void> {
    return this.setCosmetics({ backpack: { id, variants, path } });
  }

  /**
   * Updates the client party member's pet
   * @param id The pet's ID
   * @param variants The pet's variants
   * @param path The pet's path in the game files
   */
  public setPet(
    id: string,
    variants: CosmeticVariant[] = [],
    _path?: string,
  ): Promise<void> {
    // path is ignored in MpLoadout1 format — the slot key (ab) identifies the item type
    return this.setCosmetics({ backpack: { id, variants } });
  }

  /**
   * Updates the client party member's pickaxe
   * @param id The pickaxe's ID
   * @param variants The pickaxe's variants
   * @param path The pickaxe's path in the game files
   * @throws {EpicgamesAPIError}
   */
  public setPickaxe(
    id: string,
    variants: CosmeticVariant[] = [],
    path?: string,
  ): Promise<void> {
    return this.setCosmetics({ pickaxe: { id, variants, path } });
  }

  /**
   * Updates the client party member's shoes
   * @param id The shoes's ID
   * @param variants The shoes's variants
   * @param path The shoes' path in the game files
   * @throws {EpicgamesAPIError}
   */
  public setShoes(
    id: string,
    variants: CosmeticVariant[] = [],
    path?: string,
  ): Promise<void> {
    return this.setCosmetics({ shoes: { id, variants, path } });
  }

  /**
   * Updates the client party member's emote
   * @param id The emote's ID
   * @param path The emote's path in the game files
   * @throws {EpicgamesAPIError}
   */
  public async setEmote(id: string, path?: string): Promise<void> {
    if (
      (this.meta.get("Default:FrontendEmote_j") as any).FrontendEmote
        .pickable !== "None"
    ) {
      await this.clearEmote();
    }

    await this.patchMeta("Default:FrontendEmote_j", {
      pickable: ClientPartyMember.buildAssetPath(
        id,
        "/BRCosmetics/Athena/Items/Cosmetics/Dances",
        path,
      ),
      emoteSection: -2,
    });
  }

  /**
   * Updates the client party member's emoji
   * @param id The emoji's ID
   * @param path The emoji's path in the game files
   * @throws {EpicgamesAPIError}
   */
  public setEmoji(id: string, path?: string): Promise<void> {
    return this.setEmote(
      id,
      path ?? "/BRCosmetics/Athena/Items/Cosmetics/Dances/Emoji",
    );
  }

  /**
   * Clears the client party member's emote and emoji
   * @throws {EpicgamesAPIError}
   */
  public async clearEmote() {
    await this.patchMeta("Default:FrontendEmote_j", {
      pickable: "None",
      emoteSection: -1,
    });
  }

  /**
   * Clears the client party member's backpack
   * @throws {EpicgamesAPIError}
   */
  public clearBackpack(): Promise<void> {
    return this.setCosmetics({ backpack: undefined });
  }

  /**
   * Clears the client party member's shoes
   */
  public clearShoes(): Promise<void> {
    // Shoes have no equivalent slot in MpLoadout1_j yet
    return Promise.resolve();
  }

  /**
   * Updates the client party member's match state.
   * NOTE: This is visual only, the client will not actually join a match
   * @param isPlaying Whether the client is in a match
   * @param playerCount The match player count (must be between 0 and 255)
   * @param startedAt The start date of the match
   * @throws {EpicgamesAPIError}
   */
  public async setPlaying(
    isPlaying: boolean = true,
    playerCount: number = 100,
    startedAt: Date = new Date(),
  ) {
    await this.sendPatch({
      "Default:DownloadOnDemandProgress_d": this.meta.set(
        "Default:DownloadOnDemandProgress_d",
        isPlaying ? "1.000000" : "0.000000",
      ),
      "Default:PackedState_j": this.meta.mergeInner(
        "Default:PackedState_j",
        {
          location: isPlaying ? "InGame" : "PreLobby",
          gameMode: isPlaying ? "InBattleRoyale" : "None",
        },
      ),
      "Default:LobbyState_j": this.meta.mergeInner(
        "Default:LobbyState_j",
        { hasPreloadedAthena: isPlaying },
      ),
      "Default:NumAthenaPlayersLeft_U": this.meta.set(
        "Default:NumAthenaPlayersLeft_U",
        playerCount,
      ),
      "Default:UtcTimeStartedMatchAthena_s": this.meta.set(
        "Default:UtcTimeStartedMatchAthena_s",
        startedAt.toISOString(),
      ),
    });
  }

  /**
   * Updates the client party member's pre lobby map marker.
   * [0, 0] would be the center of the map
   * @param isSet Whether the marker is set
   * @param locationX The marker x location
   * @param locationY The marker y location
   * @throws {EpicgamesAPIError}
   */
  public async setMarker(
    isSet: boolean,
    locationX?: number,
    locationY?: number,
  ) {
    const currentMarker = (
      this.meta.get("Default:FrontEndMapMarker_j") as any
    )?.FrontEndMapMarker;

    await this.patchMeta("Default:FrontEndMapMarker_j", {
      bIsSet: isSet,
      markerLocation: {
        ...currentMarker?.markerLocation,
        x: locationY || 0,
        y: locationX || 0,
      },
    });
  }

  /**
   * Updates the client party member's cosmetic stats.
   * Crowns are shown when using the 'EID_Coronet' emote
   * @param crowns The number of crowns
   * @param rankedProgression The ranked progression
   * @throws {EpicgamesAPIError}
   */
  public async setCosmeticStats(crowns: number, rankedProgression: number) {
    await this.patchMeta("Default:LoadoutMeta_j", {
      stats: [
        {
          statName: "HabaneroProgression",
          statValue: rankedProgression,
        },
        {
          statName: "TotalVictoryCrowns",
          statValue: 0,
        },
        {
          statName: "TotalRoyalRoyales",
          statValue: crowns,
        },
        {
          statName: "HasCrown",
          statValue: 0,
        },
      ],
    });
  }
}

export default ClientPartyMember;

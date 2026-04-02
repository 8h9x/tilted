import Meta from "../../util/Meta.ts";
import type {
  BannerMeta,
  BattlePassMeta,
  CosmeticsVariantMeta,
  MatchMeta,
  PartyMemberIsland,
  PartyMemberSchema,
  Platform,
} from "../../resources/structs.ts";

/**
 * Represents a party member meta
 */
class PartyMemberMeta extends Meta<PartyMemberSchema> {
  /**
   * The currently equipped outfit CID
   */
  public get outfit(): string | undefined {
    return (this.get("Default:MpLoadout1_j") as any)?.MpLoadout1?.s?.ac?.i;
  }

  /**
   * The currently equipped pickaxe ID
   */
  public get pickaxe(): string | undefined {
    return (this.get("Default:MpLoadout1_j") as any)?.MpLoadout1?.s?.ap?.i;
  }

  /**
   * The current emote EID
   */
  public get emote(): string | undefined {
    const emoteAsset: string = (this.get("Default:FrontendEmote_j") as any)
      ?.FrontendEmote?.pickable;
    if (emoteAsset === "None" || !emoteAsset) return undefined;
    return emoteAsset.match(/(?<=\w*\.)\w*/)?.shift();
  }

  /**
   * The currently equipped backpack BID
   */
  public get backpack(): string | undefined {
    return (this.get("Default:MpLoadout1_j") as any)?.MpLoadout1?.s?.ab?.i;
  }

  /**
   * The currently equipped shoes
   */
  public get shoes(): string | undefined {
    // No equivalent slot exists in MpLoadout1_j yet
    return undefined;
  }

  /**
   * Whether the member is ready
   */
  public get isReady(): boolean {
    return (
      (this.get("Default:LobbyState_j") as any)?.LobbyState
        ?.gameReadiness === "Ready"
    );
  }

  /**
   * Whether the member is sitting out
   */
  public get isSittingOut(): boolean {
    return (
      (this.get("Default:LobbyState_j") as any)?.LobbyState
        ?.gameReadiness === "SittingOut"
    );
  }

  /**
   * The current input method
   */
  public get input(): string | undefined {
    return (this.get("Default:LobbyState_j") as any)?.LobbyState
      ?.currentInputType;
  }

  /**
   * The cosmetic variants
   */
  public get variants(): CosmeticsVariantMeta {
    // Variant data is now embedded in MpLoadout1_j.s slots (e.g. s.ac.v)
    // and does not map to the old vL structure
    return {};
  }

  /**
   * The custom data store
   */
  public get customDataStore(): string[] {
    return (
      (this.get("Default:ArbitraryCustomDataStore_j") as any)
        ?.ArbitraryCustomDataStore || []
    );
  }

  /**
   * The banner info
   */
  public get banner(): BannerMeta | undefined {
    const s = (this.get("Default:MpLoadout1_j") as any)?.MpLoadout1?.s;
    if (!s?.li?.i || !s?.lc?.i) return undefined;
    return {
      bannerIconId: s.li.i,
      bannerColorId: s.lc.i,
    };
  }

  /**
   * The battle pass info
   */
  public get battlepass(): BattlePassMeta | undefined {
    return (this.get("Default:BattlePassInfo_j") as any)?.BattlePassInfo;
  }

  /**
   * The platform
   */
  public get platform(): Platform | undefined {
    return (this.get("Default:PlatformData_j") as any)?.PlatformData
      ?.platform?.platformDescription?.name;
  }

  /**
   * The match info
   */
  public get match(): MatchMeta {
    const location = (this.get("Default:PackedState_j") as any)?.PackedState
      ?.location;
    const hasPreloadedAthena = (this.get("Default:LobbyState_j") as any)
      ?.LobbyState?.hasPreloadedAthena;
    const playerCount = this.get(
      "Default:NumAthenaPlayersLeft_U",
    ) as number;
    const matchStartedAt = this.get(
      "Default:UtcTimeStartedMatchAthena_s",
    ) as string;

    return {
      hasPreloadedAthena,
      location,
      matchStartedAt: new Date(matchStartedAt),
      playerCount,
    };
  }

  /**
   * The current island info
   */
  public get island(): PartyMemberIsland {
    return JSON.parse(
      (this.get("Default:MatchmakingInfo_j") as any)?.MatchmakingInfo
        .currentIsland.island,
    );
  }

  /**
   * Whether a marker has been set
   */
  public get isMarkerSet(): boolean {
    return !!(this.get("Default:FrontEndMapMarker_j") as any)
      ?.FrontEndMapMarker?.bIsSet;
  }

  /**
   * The marker location [x, y] tuple. [0, 0] if there is no marker set
   */
  public get markerLocation(): [number, number] {
    const marker = (this.get("Default:FrontEndMapMarker_j") as any)
      ?.FrontEndMapMarker?.markerLocation;
    if (!marker) return [0, 0];

    return [marker.y, marker.x];
  }

  /**
   * Whether the member owns Save The World
   */
  public get hasPurchasedSTW(): boolean {
    return !!(this.get("Default:PackedState_j") as any).PackedState
      ?.hasPurchasedSTW;
  }
}

export default PartyMemberMeta;

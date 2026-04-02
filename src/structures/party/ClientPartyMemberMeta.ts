import defaultPartyMemberMeta from "../../resources/defaultPartyMemberMeta.json" with {
  type: "json",
};
import { getRandomDefaultCharacter } from "../../util/Util.ts";
import PartyMemberMeta from "./PartyMemberMeta.ts";
import type { PartyMemberSchema } from "../../resources/structs.ts";
import type PartyMember from "./PartyMember.ts";

/**
 * Represents the client's party member meta
 */
class ClientPartyMemberMeta extends PartyMemberMeta {
  /**
   * The party member
   */
  public member: PartyMember;

  /**
   * @param member The party member
   * @param schema The schema
   */
  constructor(member: PartyMember, schema: PartyMemberSchema) {
    super({ ...defaultPartyMemberMeta });

    this.member = member;

    const defaultCharacter = getRandomDefaultCharacter();

    this.update(
      {
        "Default:MpLoadout1_j": JSON.stringify({
          MpLoadout1: {
            ...JSON.parse(
              defaultPartyMemberMeta["Default:MpLoadout1_j"],
            ).MpLoadout1,
            s: {
              ...JSON.parse(
                defaultPartyMemberMeta["Default:MpLoadout1_j"],
              ).MpLoadout1.s,
              ac: { i: defaultCharacter, v: [] },
            },
          },
        }),
        "Default:CampaignHero_j": JSON.stringify({
          CampaignHero: {
            heroItemInstanceId: "",
            heroType: `/Game/Athena/Heroes/${
              defaultCharacter.replace(
                "CID",
                "HID",
              )
            }.${defaultCharacter.replace("CID", "HID")}`,
          },
        }),
        "Default:PlatformData_j": JSON.stringify({
          PlatformData: {
            platform: {
              platformDescription: {
                name: member.client.config.platform,
                platformType: "DESKTOP",
                onlineSubsystem: "None",
                sessionType: "",
                externalAccountType: "",
                crossplayPool: "DESKTOP",
              },
            },
            uniqueId: "INVALID",
            sessionId: "",
          },
        }),
      },
      true,
    );

    if (schema) this.update(schema, true);
  }
}

export default ClientPartyMemberMeta;

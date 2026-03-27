import Endpoints from "../../resources/Endpoints.ts";
import PartyInvitationExpiredError from "../../exceptions/PartyInvitationExpiredError.ts";
import BasePartyInvitation from "./BasePartyInvitation.ts";
import { AuthSessionStoreKey } from "../../resources/enums.ts";
import type ClientUser from "../user/ClientUser.ts";
import type Friend from "../friend/Friend.ts";

/**
 * Represents a sent party invitation
 */
class SentPartyInvitation extends BasePartyInvitation {
  declare public sender: ClientUser;
  declare public receiver: Friend;

  /**
   * Declines this invitation
   * @throws {PartyInvitationExpiredError} The invitation already got accepted or declined
   */
  public async abort() {
    if (this.isExpired || this.isHandled) {
      throw new PartyInvitationExpiredError();
    }

    await this.client.http.epicgamesRequest(
      {
        method: "DELETE",
        url:
          `${Endpoints.BR_PARTY}/parties/${this.party.id}/invites/${this.receiver.id}`,
      },
      AuthSessionStoreKey.Fortnite,
    );

    this.isHandled = true;
  }
}

export default SentPartyInvitation;

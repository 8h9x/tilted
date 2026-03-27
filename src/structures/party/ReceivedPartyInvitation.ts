import Endpoints from "../../resources/Endpoints.ts";
import PartyInvitationExpiredError from "../../exceptions/PartyInvitationExpiredError.ts";
import BasePartyInvitation from "./BasePartyInvitation.ts";
import { AuthSessionStoreKey } from "../../resources/enums.ts";
import type ClientUser from "../user/ClientUser.ts";
import type Friend from "../friend/Friend.ts";

/**
 * Represents a recieved party invitation
 */
class ReceivedPartyInvitation extends BasePartyInvitation {
  declare public sender: Friend;
  declare public receiver: ClientUser;

  /**
   * Accepts this invitation
   * @throws {PartyInvitationExpiredError} The invitation already got accepted or declined
   * @throws {EpicgamesAPIError}
   */
  public async accept() {
    if (this.isExpired || this.isHandled) {
      throw new PartyInvitationExpiredError();
    }

    await this.party.join();
    this.isHandled = true;

    await this.client.http.epicgamesRequest(
      {
        method: "DELETE",
        url: `${Endpoints.BR_PARTY}/user/${
          this.client.user.self!.id
        }/pings/${this.sender.id}`,
      },
      AuthSessionStoreKey.Fortnite,
    );
  }

  /**
   * Declines this invitation
   * @throws {PartyInvitationExpiredError} The invitation already got accepted or declined
   */
  public async decline() {
    if (this.isExpired || this.isHandled) {
      throw new PartyInvitationExpiredError();
    }

    await this.client.http.epicgamesRequest(
      {
        method: "DELETE",
        url: `${Endpoints.BR_PARTY}/user/${
          this.client.user.self!.id
        }/pings/${this.sender.id}`,
      },
      AuthSessionStoreKey.Fortnite,
    );

    this.isHandled = true;
  }
}

export default ReceivedPartyInvitation;

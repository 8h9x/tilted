import BasePartyJoinRequest from "./BasePartyJoinRequest.ts";
import type SentPartyInvitation from "./SentPartyInvitation.ts";
import type ClientUser from "../user/ClientUser.ts";
import type Friend from "../friend/Friend.ts";

/**
 * Represents an incoming party join request
 */
class ReceivedPartyJoinRequest extends BasePartyJoinRequest {
  declare public receiver: ClientUser;
  declare public sender: Friend;

  /**
   * Accepts the join request. If it expired, a normal invite will be sent
   * @throws {PartyAlreadyJoinedError} The user is already a member of this party
   * @throws {PartyMaxSizeReachedError} The party reached its max size
   * @throws {EpicgamesAPIError}
   */
  public async accept(): Promise<SentPartyInvitation> {
    return this.client.invite(this.sender.id);
  }
}

export default ReceivedPartyJoinRequest;

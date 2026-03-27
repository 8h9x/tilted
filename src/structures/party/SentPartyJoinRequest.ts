import BasePartyJoinRequest from "./BasePartyJoinRequest.ts";
import type ClientUser from "../user/ClientUser.ts";
import type Friend from "../friend/Friend.ts";

/**
 * Represents an outgoing party join request
 */
class SentPartyJoinRequest extends BasePartyJoinRequest {
  declare public receiver: Friend;
  declare public sender: ClientUser;
}

export default SentPartyJoinRequest;

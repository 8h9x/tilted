import BasePendingFriend from "./BasePendingFriend.ts";
import type { PendingFriendData } from "../../resources/structs.ts";
import type Client from "../../Client.ts";

/**
 * Represents an outgoing pending friendship request
 */
class OutgoingPendingFriend extends BasePendingFriend {
  constructor(client: Client, data: PendingFriendData) {
    super(client, data);

    this.direction = "OUTGOING";
  }

  /**
   * Cancels this outgoing pending friend request
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {FriendNotFoundError} The user is not friends with the client
   * @throws {EpicgamesAPIError}
   */
  public abort(): Promise<void> {
    return this.client.friend.remove(this.id);
  }
}

export default OutgoingPendingFriend;

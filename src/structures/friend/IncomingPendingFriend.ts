import BasePendingFriend from "./BasePendingFriend.ts";
import type { PendingFriendData } from "../../resources/structs.ts";
import type Client from "../../Client.ts";

/**
 * Represents an incoming friendship request
 */
class IncomingPendingFriend extends BasePendingFriend {
  constructor(client: Client, data: PendingFriendData) {
    super(client, data);

    this.direction = "INCOMING";
  }

  /**
   * Accepts this incoming pending friend request
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {DuplicateFriendshipError} The user is already friends with the client
   * @throws {InviterFriendshipsLimitExceededError} The client's friendship limit is reached
   * @throws {InviteeFriendshipsLimitExceededError} The user's friendship limit is reached
   * @throws {InviteeFriendshipSettingsError} The user disabled friend requests
   * @throws {EpicgamesAPIError}
   */
  public accept(): Promise<void> {
    return this.client.friend.add(this.id);
  }

  /**
   * Declines this incoming pending friend request
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {FriendNotFoundError} The user is not friends with the client
   * @throws {EpicgamesAPIError}
   */
  public decline(): Promise<void> {
    return this.client.friend.remove(this.id);
  }
}

export default IncomingPendingFriend;

import User from "../user/User.ts";
import type {
  PendingFriendData,
  PendingFriendDirection,
} from "../../resources/structs.ts";
import type Client from "../../Client.ts";

/**
 * Represents a pending friend request (Either incoming or outgoing)
 */
abstract class BasePendingFriend extends User {
  /**
   * The direction of the friend request
   */
  public direction!: PendingFriendDirection;

  /**
   * The Date when the friend request was created
   */
  public createdAt: Date;

  /**
   * @param client The main client
   * @param data The friend request data
   */
  constructor(client: Client, data: PendingFriendData) {
    super(client, {
      ...data,
      id: data.accountId,
    });

    this.createdAt = new Date(data.created);
  }
}

export default BasePendingFriend;

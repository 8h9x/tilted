import BaseMessage from "../BaseMessage.ts";
import type ClientUser from "../user/ClientUser.ts";
import type Friend from "./Friend.ts";
import type SentFriendMessage from "./SentFriendMessage.ts";

/**
 * Represents a friend whisper message
 */
class BaseFriendMessage extends BaseMessage {
  /**
   * The message's content
   */
  declare public content: string;

  /**
   * The message's author
   */
  declare public author: Friend | ClientUser;

  /**
   * Replies to this whisper message
   * @param content The message that will be sent
   * @throws {FriendNotFoundError} The user is not friends with the client
   */
  public reply(content: string): Promise<SentFriendMessage> {
    return this.client.friend.sendMessage(this.author.id, content);
  }
}

export default BaseFriendMessage;

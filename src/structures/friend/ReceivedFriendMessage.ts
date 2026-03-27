import BaseFriendMessage from "./BaseFriendMessage.ts";
import type SentFriendMessage from "./SentFriendMessage.ts";
import type Friend from "./Friend.ts";

/**
 * Represents a received friend whisper message
 */
class ReceivedFriendMessage extends BaseFriendMessage {
  /**
   * The message's author
   */
  declare public author: Friend;

  /**
   * Replies to this whisper message
   * @param content The message that will be sent
   * @throws {FriendNotFoundError} The user is not friends with the client
   */
  public override reply(content: string): Promise<SentFriendMessage> {
    return this.client.friend.sendMessage(this.author.id, content);
  }
}

export default ReceivedFriendMessage;

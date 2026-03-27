import BaseFriendMessage from "./BaseFriendMessage.ts";
import type ClientUser from "../user/ClientUser.ts";

/**
 * Represents a sent friend whisper message
 */
class SentFriendMessage extends BaseFriendMessage {
  /**
   * The message's author
   */
  declare public author: ClientUser;
}

export default SentFriendMessage;

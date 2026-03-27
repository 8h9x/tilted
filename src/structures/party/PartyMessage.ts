import BaseMessage from "../BaseMessage.ts";
import type { PartyMessageData } from "../../resources/structs.ts";
import type Client from "../../Client.ts";
import type ClientParty from "./ClientParty.ts";
import type PartyMember from "./PartyMember.ts";

/**
 * Represents a party chat message
 */
class PartyMessage extends BaseMessage {
  /**
   * The message's author
   */
  declare public author: PartyMember;

  /**
   * The message's party
   */
  public party: ClientParty;

  /**
   * @param client The main client
   * @param data The message's data
   */
  constructor(client: Client, data: PartyMessageData) {
    super(client, data);

    this.party = data.party;
  }

  /**
   * Replies to this party chat message
   * @param content The message that will be sent
   * @throws {SendMessageError} The message failed to send
   */
  public reply(content: string): void {
    // return this.party.chat.send(content);
  }
}

export default PartyMessage;

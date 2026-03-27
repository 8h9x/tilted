import Endpoints from "../../resources/Endpoints.ts";
import Base from "../../Base.ts";
import { AuthSessionStoreKey } from "../../resources/enums.ts";
import type Client from "../../Client.ts";
import type ClientParty from "./ClientParty.ts";
import type User from "../user/User.ts";

/**
 * Represents a party member join confirmation request
 */
class PartyMemberConfirmation extends Base {
  /**
   * The party
   */
  public party: ClientParty;

  /**
   * The user who requested to join the party
   */
  public user: User;

  /**
   * The creation date of the request
   */
  public createdAt: Date;

  /**
   * @param client The main client
   * @param party The party
   * @param user The user who requested to join the party
   * @param data The party confirmation data
   */
  constructor(client: Client, party: ClientParty, user: User, data: any) {
    super(client);

    this.party = party;
    this.user = user;
    this.createdAt = new Date(data.sent);
  }

  /**
   * Whether the join confirmation is still active (can be confirmed / rejected)
   */
  public get isActive(): boolean {
    return this.party.pendingMemberConfirmations.has(this.user.id);
  }

  /**
   * Accepts the member join confirmation and makes the member join the party
   * @throws {EpicgamesAPIError}
   */
  public async confirm() {
    await this.client.http.epicgamesRequest(
      {
        method: "POST",
        url:
          `${Endpoints.BR_PARTY}/parties/${this.party.id}/members/${this.user.id}/confirm`,
      },
      AuthSessionStoreKey.Fortnite,
    );

    this.party.pendingMemberConfirmations.delete(this.user.id);
  }

  /**
   * Rejects the member join confirmation
   * @throws {EpicgamesAPIError}
   */
  public async reject() {
    await this.client.http.epicgamesRequest(
      {
        method: "POST",
        url:
          `${Endpoints.BR_PARTY}/parties/${this.party.id}/members/${this.user.id}/reject`,
      },
      AuthSessionStoreKey.Fortnite,
    );

    this.party.pendingMemberConfirmations.delete(this.user.id);
  }
}

export default PartyMemberConfirmation;

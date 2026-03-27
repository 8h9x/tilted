import Endpoints from "../resources/Endpoints.ts";
import {
  AuthSessionStoreKey,
  ConversationType,
  SignedMessageType,
} from "../resources/enums.ts";
import Base from "../Base.ts";
import type { PublicKeyData } from "../resources/httpResponses.ts";
import type { ChatMessagePayload } from "../resources/structs.ts";

// private scope
const generateCustomCorrelationId = () =>
  `EOS-${Date.now()}-${crypto.randomUUID()}`;

/**
 * Represent's the client's chat manager (dm, party chat) via eos.
 */
class ChatManager extends Base {
  /**
   * DM conversations cache map (account id -> conversation id)
   */
  private dmConversations: Map<string, string> = new Map();

  /**
   * The private key for signing messages (CryptoKey)
   */
  private privateKey?: CryptoKey;

  /**
   * The public key for verifying messages (raw base64 string)
   */
  private publicKey?: string;

  /**
   * The public key data registered on epic's servers
   */
  private publicKeyData?: PublicKeyData;

  /**
   * Whether the keypair for message signing exists
   */
  public get keypairExists(): boolean {
    return !!this.privateKey && !!this.publicKey;
  }

  /**
   * Whether the keypair has been registered on epic's servers
   */
  public get keypairRegistered(): boolean {
    return !!this.publicKeyData;
  }

  /**
   * Returns the chat namespace, this is the eos deployment id
   */
  public get namespace(): string {
    return this.client.config.eosDeploymentId;
  }

  /**
   * Sends a private message to the specified user
   * @param user the account id or displayname
   * @param message the message object
   * @returns the message id
   * @throws {UserNotFoundError} When the specified user was not found
   * @throws {EpicgamesAPIError} When the api request failed
   */
  public async whisperUser(
    user: string,
    message: ChatMessagePayload,
  ): Promise<string> {
    const accountId = await this.client.user.resolveId(user);

    const conversationId = await this.getDMConversationId(accountId);

    return this.sendMessageInConversation(
      conversationId,
      message,
      [accountId, this.client.user.self!.id],
      ConversationType.DirectMessage,
    );
  }

  /**
   * Sends a message in the specified conversation (e.g. party chat)
   * @param conversationId the conversation id, usually `p-[PARTYID]`
   * @param message the message object
   * @param allowedRecipients the account ids, that should receive the message
   * @returns the message id
   * @throws {EpicgamesAPIError}
   */
  public async sendMessageInConversation(
    conversationId: string,
    message: ChatMessagePayload,
    allowedRecipients: string[],
    conversationType: ConversationType,
  ): Promise<string> {
    const correlationId = generateCustomCorrelationId();

    const { body, signature } = await this.createSignedMessage(
      conversationId,
      message.body,
      conversationType === ConversationType.DirectMessage
        ? SignedMessageType.Persistent
        : SignedMessageType.Party,
    );

    await this.client.http.epicgamesRequest(
      {
        method: "POST",
        url:
          `${Endpoints.EOS_CHAT}/v1/public/${
            conversationType === ConversationType.DirectMessage
              ? "_"
              : this.namespace
          }` +
          `/conversations/${conversationId}/messages?fromAccountId=${
            this.client.user.self!.id
          }`,
        headers: {
          "Content-Type": "application/json",
          "X-Epic-Correlation-ID": correlationId,
        },
        body: JSON.stringify({
          allowedRecipients,
          message: {
            body,
          },
          isReportable: false,
          metadata: {
            TmV: "2",
            Pub: this.publicKeyData!.jwt,
            Sig: signature,
            NPM: conversationType === ConversationType.Party ? "1" : undefined,
            PlfNm: this.client.config.platform,
            PlfId: this.client.user.self!.id,
          },
        }),
      },
      AuthSessionStoreKey.FortniteEOS,
    );

    return correlationId;
  }

  public async createDMConversation(
    recepientId: string,
    createIfExists = false,
  ): Promise<{
    conversationId: string;
  }> {
    return await this.client.http.epicgamesRequest<{
      conversationId: string;
    }>(
      {
        method: "POST",
        url: `${Endpoints.EOS_CHAT}/v1/public/_/conversations?createIfExists=${createIfExists}`,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "",
          type: "dm",
          members: [this.client.user.self!.id, recepientId],
        }),
      },
      AuthSessionStoreKey.FortniteEOS,
    );
  }

  /**
   * Ensures that message signing is possible
   */
  public async ensureMessageSigning() {
    if (!this.keypairExists) {
      await this.generateKeypair();
    }

    if (!this.keypairRegistered) {
      await this.registerKeypair();
    }
  }

  /**
   * Resolves the conversation id for a dm with the specified user
   * @param recepientId The account id of the recepient
   * @returns The conversation id
   */
  private async getDMConversationId(recepientId: string) {
    if (this.dmConversations.has(recepientId)) {
      return this.dmConversations.get(recepientId)!;
    }

    const conversationData = await this.createDMConversation(recepientId);
    this.dmConversations.set(recepientId, conversationData.conversationId);

    return conversationData.conversationId;
  }

  /**
   * Signs a message for the specified conversation
   * @param conversationId The conversation id
   * @param content The message content
   * @param type The signed message type
   */
  private async createSignedMessage(
    conversationId: string,
    content: string,
    type: SignedMessageType,
  ) {
    await this.ensureMessageSigning();

    const timestamp = Date.now();

    const messageInfo = {
      mid: crypto.randomUUID(),
      sid: this.client.user.self!.id,
      rid: conversationId,
      msg: content,
      tst: timestamp,
      seq: 1,
      rec: false,
      mts: [],
      cty: type,
    };

    const body = btoa(JSON.stringify(messageInfo));

    const messageToSign = new Uint8Array([
      ...new TextEncoder().encode(body),
      0,
    ]);

    const signatureBuffer = await crypto.subtle.sign(
      "Ed25519",
      this.privateKey!,
      messageToSign,
    );

    const signature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer)),
    );

    return { body, signature };
  }

  /**
   * Generates a ed25519 keypair for message signing
   */
  private async generateKeypair() {
    const keyPair = (await crypto.subtle.generateKey(
      { name: "Ed25519" },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;

    this.privateKey = keyPair.privateKey;

    // Export public key as raw 32-byte format and encode to base64
    const rawPublicKeyBuffer = await crypto.subtle.exportKey(
      "raw",
      keyPair.publicKey,
    );
    const rawPublicKeyBytes = new Uint8Array(rawPublicKeyBuffer);
    this.publicKey = btoa(String.fromCharCode(...rawPublicKeyBytes));
  }

  /**
   * Registers the public key on epic's servers
   */
  private async registerKeypair() {
    const publicKeyData =
      await this.client.http.epicgamesRequest<PublicKeyData>(
        {
          method: "POST",
          url: `${Endpoints.PUBLICKEY}/v2/publickey`,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: this.publicKey,
            algorithm: "ed25519",
          }),
        },
        AuthSessionStoreKey.Fortnite,
      );

    this.publicKeyData = publicKeyData;
  }
}

export default ChatManager;

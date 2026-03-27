import { URLSearchParams } from "node:url";
import AuthSession from "./AuthSession.ts";
import { AuthSessionType } from "../resources/enums.ts";
import Endpoints from "../resources/Endpoints.ts";
import type Client from "../Client.ts";
import type { EOSAuthData, EOSTokenInfo } from "../resources/structs.ts";

class EOSAuthSession extends AuthSession<AuthSessionType.EOS> {
  public refreshToken: string;
  public refreshTokenExpiresAt: Date;
  public applicationId: string;
  public mergedAccounts: string[];
  public scope: string;

  public refreshTimeout?: ReturnType<typeof setTimeout>;
  private readonly basePayload: Record<string, string>;

  constructor(
    client: Client,
    data: EOSAuthData,
    clientSecret: string,
    basePayload: Record<string, string>,
  ) {
    super(client, data, clientSecret, AuthSessionType.EOS);

    this.applicationId = data.application_id;
    this.mergedAccounts = data.merged_accounts;
    this.scope = data.scope;
    this.refreshToken = data.refresh_token;
    this.refreshTokenExpiresAt = new Date(data.refresh_expires_at);
    this.basePayload = basePayload;
  }

  public async verify(forceVerify = false): Promise<boolean> {
    if (!forceVerify && this.isExpired) {
      return false;
    }

    const tokenInfo = await this.client.http.epicgamesRequest<EOSTokenInfo>({
      method: "POST",
      url: Endpoints.EOS_TOKEN_INFO,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: this.accessToken,
      }).toString(),
    });

    return tokenInfo.active === true;
  }

  public async revoke() {
    clearTimeout(this.refreshTimeout);
    this.refreshTimeout = undefined;

    await this.client.http.epicgamesRequest({
      method: "POST",
      url: Endpoints.EOS_TOKEN_REVOKE,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: this.accessToken,
      }).toString(),
    });
  }

  public async refresh() {
    if (this.refreshLock.isLocked) {
      await this.refreshLock.wait();
      return;
    }

    try {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;

      const response = await EOSAuthSession.authenticate(
        this.client,
        this.clientId,
        this.clientSecret,
        {
          ...this.basePayload,
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        },
      );

      this.accessToken = response.access_token;
      this.expiresAt = new Date(response.expires_at);
      this.refreshToken = response.refresh_token;
      this.refreshTokenExpiresAt = new Date(response.refresh_expires_at);

      this.initRefreshTimeout();
    } finally {
      this.refreshLock.unlock();
    }
  }

  public initRefreshTimeout() {
    clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(
      () => this.refresh(),
      this.expiresAt.getTime() - Date.now() - 15 * 60 * 1000,
    );
  }

  private static async authenticate(
    client: Client,
    clientId: string,
    clientSecret: string,
    payload: Record<string, string>,
  ) {
    const auth = await client.http.epicgamesRequest<EOSAuthData>({
      method: "POST",
      url: Endpoints.EOS_TOKEN,
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(payload).toString(),
    });

    return auth;
  }

  public static async create(
    client: Client,
    clientId: string,
    clientSecret: string,
    createPayload: Record<string, string>,
    basePayload: Record<string, string>,
  ): Promise<EOSAuthSession> {
    const auth = await EOSAuthSession.authenticate(
      client,
      clientId,
      clientSecret,
      {
        ...basePayload,
        ...createPayload,
      },
    );

    const session = new EOSAuthSession(client, auth, clientSecret, basePayload);

    session.initRefreshTimeout();

    return session;
  }
}

export default EOSAuthSession;

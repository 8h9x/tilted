import HTTPError from "./HTTPError.ts";
import type { RequestConfig } from "./types.ts";
import Base from "../Base.ts";
import AuthenticationMissingError from "../exceptions/AuthenticationMissingError.ts";
import { invalidTokenCodes } from "../resources/constants.ts";
import EpicgamesAPIError from "../exceptions/EpicgamesAPIError.ts";
import type { AuthSessionStoreKey } from "../resources/enums.ts";
import type Client from "../Client.ts";
import type { EpicgamesAPIErrorData } from "../resources/httpResponses.ts";

/**
 * Represents the client's HTTP manager
 * @private
 */
class HTTP extends Base {
  /**
   * The internal default headers for all requests
   */
  private defaultHeaders: Headers;

  /**
   * @param client The main client
   */
  constructor(client: Client) {
    super(client);
    // new Headers(undefined) is valid and produces empty headers
    this.defaultHeaders = new Headers(
      this.client.config.http.headers as HeadersInit,
    );
  }

  /**
   * The internal method to handle fetching with abstraction for network errors, non-2xx, 5xx retries and 429 backoff
   * @param config
   * @param retries
   */
  private async performFetch(
    config: RequestConfig,
    retries = 0,
  ): Promise<Response> {
    const { url, ...init } = config;
    const reqStartTime = Date.now();
    const method = (init.method ?? "GET").toUpperCase();

    const headers = new Headers({
      "Accept-Language": this.client.config.language,
    });
    this.defaultHeaders.forEach((v, k) => headers.set(k, v));
    if (init.headers) {
      new Headers(init.headers as HeadersInit).forEach((v, k) =>
        headers.set(k, v)
      );
    }

    let response: Response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch (err: any) {
      const reqDuration = (Date.now() - reqStartTime) / 1000;
      this.client.debug(
        `${method} ${url} (${
          reqDuration.toFixed(
            2,
          )
        }s): ${err.name} - ${err.message}`,
        "http",
      );
      throw err;
    }

    const reqDuration = (Date.now() - reqStartTime) / 1000;
    this.client.debug(
      `${method} ${url} (${
        reqDuration.toFixed(
          2,
        )
      }s): ${response.status} ${response.statusText}`,
      "http",
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      const data: unknown = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      const httpError = new HTTPError(response, data);

      if (
        response.status >= 500 &&
        retries < this.client.config.restRetryLimit
      ) {
        return this.performFetch(config, retries + 1);
      }

      if (
        response.status === 429 ||
        (data as any)?.errorCode === "errors.com.epicgames.common.throttled"
      ) {
        const retryString = response.headers.get("retry-after") ||
          (data as any)?.messageVars?.[0] ||
          (data as any)?.errorMessage?.match(/(?<=in )\d+(?= second)/)?.[0];
        const retryAfter = parseInt(retryString, 10);
        if (!Number.isNaN(retryAfter)) {
          await new Promise((res) => setTimeout(res, retryAfter * 1000 + 500));
          return this.performFetch(config, retries);
        }
      }

      throw httpError;
    }

    return response;
  }

  /**
   * Sends an HTTP request
   * @param config The request config
   */
  public async request<T = any>(config: RequestConfig): Promise<T> {
    const response = await this.performFetch(config);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /**
   * Sends an HTTP request with a Uint8Array response
   * @param config The request config
   */
  public async requestBytes(config: RequestConfig): Promise<Uint8Array> {
    const response = await this.performFetch(config);
    return new Uint8Array(await response.arrayBuffer());
  }

  /**
   * Sends an HTTP request to the Fortnite API
   * @param config The request config
   * @param includeAuthentication Whether to include authentication
   * @throws {EpicgamesAPIError}
   * @throws {HTTPError}
   */
  public async epicgamesRequest<T = any>(
    config: RequestConfig,
    auth?: AuthSessionStoreKey,
  ): Promise<T> {
    if (auth) {
      const authSession = this.client.auth.sessions.get(auth);
      if (!authSession) throw new AuthenticationMissingError(auth);

      await authSession.refreshLock.wait();
    }

    try {
      return await this.request<T>({
        ...config,
        ...(auth && {
          headers: {
            ...config.headers,
            Authorization: `bearer ${
              this.client.auth.sessions.get(auth)!.accessToken
            }`,
          },
        }),
      });
    } catch (err: unknown) {
      if (err instanceof HTTPError) {
        const data = err.data as EpicgamesAPIErrorData | undefined;

        if (
          auth &&
          data?.errorCode &&
          invalidTokenCodes.includes(data.errorCode)
        ) {
          await this.client.auth.sessions.get(auth)!.refresh();

          return this.epicgamesRequest(config, auth);
        }

        if (typeof data?.errorCode === "string") {
          throw new EpicgamesAPIError(data!, config, err.response.status);
        }
      }

      throw err;
    }
  }
}

export default HTTP;

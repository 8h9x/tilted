/** Per-request config — extends standard RequestInit to include url */
export interface RequestConfig extends RequestInit {
  url: URL | string;
}

/**
 * Default HTTP options applied to every request.
 * Replaces RawAxiosRequestConfig as the type for ClientConfig.http.
 */
export type HTTPConfig = Pick<RequestInit, "headers">;

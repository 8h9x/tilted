class HTTPError extends Error {
  /** The raw web API Response (status, statusText, headers) */
  public readonly response: Response;
  /** The pre-parsed response body (JSON object or plain string) */
  public readonly data: unknown;

  constructor(response: Response, data: unknown) {
    super(`${response.status} ${response.statusText}`);
    this.name = "HTTPError";
    this.response = response;
    this.data = data;
  }
}

export default HTTPError;

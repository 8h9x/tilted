import path from "node:path";
import Base from "../Base.ts";
import type Client from "../Client.ts";
import type { ImageData } from "../resources/structs.ts";

/**
 * Represents an image
 */
class Image extends Base {
  /**
   * The image's url
   */
  public url: string;

  /**
   * The image's width
   */
  public width?: number;

  /**
   * The image's height
   */
  public height?: number;

  /**
   * The image's file extension (usually 'png' or 'jpeg' / 'jpg')
   */
  public fileExtension: string;

  /**
   * @param client The main client
   * @param data The image's data
   */
  constructor(client: Client, data: ImageData) {
    super(client);

    this.url = data.url;
    this.width = data.width;
    this.height = data.height;
    this.fileExtension = path.extname(this.url);
  }

  /**
   * Downloads the image
   * @throws HTTPError
   */
  public download(): Promise<Uint8Array> {
    return this.client.http.requestBytes({ method: "GET", url: this.url });
  }

  public override toString(): string {
    return this.url;
  }
}

export default Image;

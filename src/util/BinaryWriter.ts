/**
 * Represents a writer for binary data used for tournament replays
 * @private
 */
class BinaryWriter {
  /**
   * The buffer
   */
  public buffer: Uint8Array;
  /**
   * The current byte offset
   */
  public offset: number;
  /**
   * The DataView for typed writes
   */
  private view: DataView;

  /**
   * @param buffer The buffer
   */
  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );
    this.offset = 0;
  }

  /**
   * Skip bytes
   */
  public skip(count: number) {
    this.offset += count;
    return this;
  }

  /**
   * Change the current buffer offset
   */
  public goto(offset: number) {
    this.offset = offset;
    return this;
  }

  /**
   * Write an int8
   */
  public writeInt8(value: number) {
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /**
   * Write a uint8
   */
  public writeUInt8(value: number) {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /**
   * Write an int16
   */
  public writeInt16(value: number) {
    this.view.setInt16(this.offset, value, true);
    this.offset += 2;
    return this;
  }

  /**
   * Write a uint16
   */
  public writeUInt16(value: number) {
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
    return this;
  }

  /**
   * Write an int32
   */
  public writeInt32(value: number) {
    this.view.setInt32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  /**
   * Write a uint32
   */
  public writeUInt32(value: number) {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  /**
   * Write an int64
   */
  public writeInt64(value: bigint) {
    this.view.setBigInt64(this.offset, value, true);
    this.offset += 8;
    return this;
  }

  /**
   * Write a uint64
   */
  public writeUInt64(value: bigint) {
    this.view.setBigUint64(this.offset, value, true);
    this.offset += 8;
    return this;
  }

  /**
   * Write a float32
   */
  public writeFloat32(value: number) {
    this.view.setFloat32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  /**
   * Write a string
   */
  public writeString(value: string, encoding: "utf8" | "utf16le" = "utf8") {
    const encoder = new TextEncoder();
    if (encoding === "utf8") {
      const encoded = encoder.encode(value);
      this.writeInt32(value.length + 1);
      this.writeBytes(encoded);
      this.skip(1);
    } else {
      const encoded = new Uint8Array(value.length * 2);
      const view = new DataView(encoded.buffer);
      for (let i = 0; i < value.length; i++) {
        view.setUint16(i * 2, value.charCodeAt(i), true);
      }
      this.writeInt32(-(value.length + 1));
      this.writeBytes(encoded);
      this.skip(2);
    }
    return this;
  }

  /**
   * Write a boolean
   */
  public writeBool(value: boolean) {
    this.writeInt32(value === true ? 1 : 0);
    return this;
  }

  /**
   * Write multiple bytes
   */
  public writeBytes(value: Uint8Array) {
    this.buffer.set(value, this.offset);
    this.offset += value.byteLength;
    return this;
  }

  /**
   * Write 16 bytes as a hex string
   */
  public writeId(value: string) {
    const encoder = new TextEncoder();
    const hex = Array.from(encoder.encode(value))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    this.writeBytes(encoder.encode(hex));
    return this;
  }
}

export default BinaryWriter;

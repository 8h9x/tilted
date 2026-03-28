/**
 * Represents an asynchronous task lock used for pending token refreshing or party changes
 * @private
 */
class AsyncLock {
  /**
   * The lock promise
   */
  private release?: () => void;

  /**
   * Whether this lock is active
   */
  public get isLocked(): boolean {
    return !!this.release;
  }

  /**
   * Returns a promise that will resolve once the lock is released
   */
  public wait(): Promise<void> {
    if (!this.release) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const original = this.release!;
      this.release = () => {
        original();
        resolve();
      };
    });
  }

  /**
   * Activates this lock
   */
  public lock() {
    let release!: () => void;
    new Promise<void>((res) => {
      release = res;
    });
    this.release = release;
  }

  /**
   * Deactivates this lock
   */
  public unlock() {
    this.release?.();
    this.release = undefined;
  }
}

export default AsyncLock;

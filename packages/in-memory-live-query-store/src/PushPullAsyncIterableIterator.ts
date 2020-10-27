export class PushPullAsyncIterableIterator<T>
  implements AsyncIterableIterator<T> {
  private pushQueue: T[] = [];
  private pullQueue: ((value: IteratorResult<T>) => void)[] = [];
  private isRunning: boolean = true;
  private onReturn: () => void;

  constructor(onReturn: () => void) {
    this.onReturn = onReturn;
  }

  public async next(): Promise<IteratorResult<T>> {
    return new Promise((resolve) => {
      if (this.pushQueue.length !== 0) {
        resolve(
          this.isRunning
            ? { value: this.pushQueue.shift(), done: false }
            : { value: undefined, done: true }
        );
      } else {
        this.pullQueue.push(resolve);
      }
    });
  }

  public async return(): Promise<IteratorResult<T>> {
    if (this.isRunning) {
      this.isRunning = false;
      for (const resolve of this.pullQueue) {
        resolve({ value: undefined, done: true });
      }
      this.pullQueue.length = 0;
      this.pushQueue.length = 0;
      this.onReturn();
    }
    return { value: undefined, done: true };
  }

  public [Symbol.asyncIterator]() {
    return this;
  }

  public push(value: T) {
    if (this.pullQueue.length > 0) {
      const resolve = this.pullQueue.shift();
      resolve(
        this.isRunning
          ? { value, done: false }
          : { value: undefined, done: true }
      );
    } else {
      this.pushQueue.push(value);
    }
  }
}

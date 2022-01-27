export interface CancelableTask {
  description: { host: string; port: number; name: string; protocol: string };
  cancel(): void;
  run(workerId: number): Promise<void>;
}

export class ProxyTesterWorker {
  constructor(public readonly workerId: number) {
    this._currentTask = null;
  }

  private taskSource: AsyncGenerator<CancelableTask>;

  start(taskSource: AsyncGenerator<CancelableTask>) {
    this.taskSource = taskSource;
    this.work();
  }

  private _currentTask: CancelableTask | null;

  public get currentTask() {
    return this._currentTask;
  }

  private async work() {
    for await (const iterator of this.taskSource) {
      this._currentTask = iterator;
      await iterator
        .run(this.workerId)
        .catch((err) =>
          console.log(`WorkerId [${this.workerId}]: ${err.message}`)
        )
        .finally(() => (this._currentTask = null));
    }
  }
}

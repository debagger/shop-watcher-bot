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
    for await (const task of this.taskSource) {
      this._currentTask = task;
      let timeout: NodeJS.Timeout;
      await Promise.any([
        task
          .run(this.workerId)
          .catch((err) =>
            console.log(`WorkerId [${this.workerId}]: ${err.message}`)
          )
          .finally(() => {
            this._currentTask = null;
            if (timeout) clearTimeout(timeout);
          }),
        new Promise<void>((resolve) => {
          timeout = setTimeout(() => {
            task.cancel()
            resolve()
          }, 300000);
        }),
      ]);
    }
  }
}

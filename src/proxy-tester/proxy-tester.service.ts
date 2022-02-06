import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter } from "stream";
import { Repository } from "typeorm";
import { Proxy, ProxyTestType, ProxyTestRun } from "./../entities";
import { CancelableTask, ProxyTesterWorker } from "./proxy-tester-worker.class";
import * as ProxyTests from "./proxy-tests";
import { ProxyTestResultType } from "./proxy-tests/proxy-test.type";
import { PubSub } from "graphql-subscriptions";
import { WorkerResult } from "./worker-result.class";

@Injectable()
export class ProxyTesterService implements OnModuleInit {
  constructor(
    @InjectRepository(Proxy) private proxyListRepo: Repository<Proxy>,
    @InjectRepository(ProxyTestType)
    private proxyTestTypeRepo: Repository<ProxyTestType>,
    @InjectRepository(ProxyTestRun)
    private proxyTestRunRepo: Repository<ProxyTestRun>
  ) {
    const workersCount = 50;
    this.workers = [];
    for (let workerId = 0; workerId < workersCount; workerId++) {
      this.workers.push(new ProxyTesterWorker(workerId));
    }
    this._pubSub = new PubSub();
  }

  onModuleInit() {
    this.run();
  }

  workers: ProxyTesterWorker[];

  private _pubSub: PubSub;

  public get pubSub() {
    return this._pubSub;
  }

  private readonly saveTestRunResult = async (
    testResult: ProxyTestResultType
  ) => {
    let testType = await this.proxyTestTypeRepo.findOne({
      name: testResult.name,
    });
    if (!testType) {
      testType = this.proxyTestTypeRepo.create({ name: testResult.name });
      await this.proxyTestTypeRepo.save(testType);
    }
    const { host, port } = testResult;
    const testedProxy = await this.proxyListRepo.findOne({ host, port });
    if (!testedProxy) return;

    const { protocol, errorResult, okResult, duration_ms } = testResult;
    if (errorResult) {
      delete errorResult.stack;
      delete errorResult.httpsAgent;
    }
    return await this.proxyTestRunRepo.save({
      testedProxy,
      protocol,
      errorResult: errorResult ? { message: errorResult.message } : null,
      okResult,
      testType,
      runTime: new Date(),
      duration_ms,
    });
  };

  private _isStarted: boolean;

  public get isStarted() {
    return this._isStarted;
  }

  private getGenerator = async function* () {
    const list = await this.proxyListRepo.find({
      select: ["id", "host", "port"],
      order: { id: "DESC" },
    });
    while (this._isStarted) {
      for (const proxyListItem of list) {
        for (const protocol of <[4, 5]>[4, 5]) {
          for (const proxyTest of Object.values(ProxyTests)) {
            if (!this._isStarted) {
              console.log(`isStarted = ${this._isStarted}`);
              return;
            }
            const { host, port } = proxyListItem;
            const run = async (workerId: number) => {
              const result = await proxyTest({ host, port, protocol });
              const proxyURL = `socks${protocol}://${host}:${port}`;
              const savedResult = await this.saveTestRunResult(result);
              const pub = new WorkerResult();
              pub.workerId = workerId;
              pub.result = savedResult;
              this.pubSub.publish("newTaskResult", { onTaskFinish: pub });
              // if (result.okResult)
              //   console.log(
              //     `Worker [${workerId}] '${result.name}' <${proxyURL}> OK`
              //   );
              // if (result.errorResult)
              //   console.log(
              //     `Worker [${workerId}] '${result.name}' <${proxyURL}> ${result.errorResult.message}`
              //   );
            };
            const newTask: CancelableTask = {
              run,
              cancel: () => {},
              description: {
                host,
                port,
                protocol: `socks${protocol}`,
                name: proxyTest.name,
              },
            };
            yield newTask;
          }
        }
      }
    }
  };

  run() {
    if (!this._isStarted) {
      const taskSource = this.getGenerator();
      this.workers.forEach((worker) => worker.start(taskSource));
      this._isStarted = true;
    }
  }

  stop() {
    this._isStarted = false;
  }

  // async checkAllProxies() {
  //   const workersCount = 500;
  //   const eventEmitter = new EventEmitter();

  //   eventEmitter.setMaxListeners(workersCount);

  //   const list = await this.proxyListRepo.find({
  //     select: ["id", "host", "port"],
  //     order: { id: "DESC" },
  //   });

  //   const tasks: (() => Promise<ProxyTestResultType>)[] = [];
  //   for (const protocol of <[4, 5]>[4, 5]) {
  //     for (const proxyListItem of list) {
  //       for (const proxyTest of Object.values(ProxyTests)) {
  //         const { host, port } = proxyListItem;
  //         const newTask = () => proxyTest({ host, port, protocol });
  //         tasks.push(newTask);
  //       }
  //     }
  //   }

  //   const totalTasks = tasks.length;

  //   let cancelTimeout: NodeJS.Timeout;

  //   const interval = setInterval(() => {
  //     console.log(`${tasks.length}/${totalTasks} in queue`);
  //     if (tasks.length === 0 && !cancelTimeout) {
  //       cancelTimeout = setTimeout(() => {
  //         console.log("Cancel event emitted");
  //         eventEmitter.emit("cancel");
  //       }, 120000);
  //       console.log("No tasks in queue. Wait 2 minutes for cancel.");
  //     }
  //   }, 60000);

  //   const worker = (workerIndex: number) => {
  //     return new Promise<void>((resolve, reject) => {
  //       const cancelListener = () => {
  //         console.log(`Worker ${workerIndex} rejection on 'cancel' event`);
  //         reject(new Error(`Worker ${workerIndex} cancelled`));
  //       };
  //       eventEmitter.on("cancel", cancelListener);

  //       const executeTask = () => {
  //         if (tasks.length > 0) {
  //           const task = tasks.pop();
  //           task()
  //             .then((res) => {
  //               const { name, protocol, host, port, errorResult, okResult } =
  //                 res;
  //               const proxyURL = `socks${protocol}://${host}:${port}`;
  //               this.saveTestRunResult(res)
  //                 .then(() =>
  //                   console.log(
  //                     `worker ${workerIndex}: ${name} ${proxyURL} ${
  //                       okResult ? "OK" : ""
  //                     }${errorResult ? errorResult.message : ""}`
  //                   )
  //                 )
  //                 .catch((err) =>
  //                   console.log(
  //                     `worker ${workerIndex}: ${name} ${proxyURL} ${err.message}`
  //                   )
  //                 );
  //             })
  //             .catch((error) => {
  //               console.log(`Worker ${workerIndex} error ${error.message}`);
  //             })
  //             .finally(() => {
  //               executeTask();
  //             });
  //         } else {
  //           eventEmitter.off("cancel", cancelListener);
  //           console.log(`Worker ${workerIndex} finished`);
  //           resolve();
  //         }
  //       };
  //       executeTask();
  //     });
  //   };

  //   const workers = Array(workersCount)
  //     .fill(null)
  //     .map((_, i) => worker(i).catch((err) => console.log(err.message)));

  //   await Promise.all(workers);
  //   if (cancelTimeout) clearTimeout(cancelTimeout);
  //   clearInterval(interval);
  // }
}

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
      where: {
      name: testResult.name,
      }
    });
    if (!testType) {
      testType = this.proxyTestTypeRepo.create({ name: testResult.name });
      await this.proxyTestTypeRepo.save(testType);
    }
    const { host, port } = testResult;
    const testedProxy = await this.proxyListRepo.findOne({ where: { host, port } });
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
              const savedResult = await this.saveTestRunResult(result);
              const pub = new WorkerResult();
              pub.workerId = workerId;
              pub.result = savedResult;
              this.pubSub.publish("newTaskResult", { onTaskFinish: pub });
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
}

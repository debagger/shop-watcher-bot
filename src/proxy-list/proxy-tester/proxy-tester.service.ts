import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter } from 'stream';
import { Repository } from "typeorm";
import { Proxy, ProxyTestType, ProxyTestRun } from "./../../entities";
import * as ProxyTests from './proxy-tests'
import { ProxyTestResultType } from './proxy-tests/proxy-test.type';

@Injectable()
export class ProxyTesterService {
    constructor(
        @InjectRepository(Proxy) private proxyListRepo: Repository<Proxy>,
        @InjectRepository(ProxyTestType) private proxyTestTypeRepo: Repository<ProxyTestType>,
        @InjectRepository(ProxyTestRun) private proxyTestRunRepo: Repository<ProxyTestRun>
    ) { }


    async saveTestRunResult(testResult: ProxyTestResultType) {
        let testType = await this.proxyTestTypeRepo.findOne({ name: testResult.name })
        if (!testType) {
            testType = this.proxyTestTypeRepo.create({ name: testResult.name })
            await this.proxyTestTypeRepo.save(testType)
        }
        const { host, port } = testResult
        const testedProxy = await this.proxyListRepo.findOne({ host, port })
        if (!testedProxy) return

        const { protocol, errorResult, okResult, duration_ms } = testResult
        if (errorResult) {
            delete errorResult.stack
        }
        await this.proxyTestRunRepo.save({ testedProxy, protocol, errorResult, okResult, testType, runTime: new Date(), duration_ms })
    }

    async checkAllProxies() {
        const workersCount = 500
        const eventEmitter = new EventEmitter()

        eventEmitter.setMaxListeners(workersCount)

        const list = await this.proxyListRepo.find({
            select: ['id', 'host', 'port'],
            order: { id: 'DESC' },
        })

        const tasks: (() => Promise<ProxyTestResultType>)[] = []
        for (const protocol of <[4, 5]>[4, 5]) {
            for (const proxyListItem of list) {
                for (const proxyTest of Object.values(ProxyTests)) {
                    const { host, port } = proxyListItem
                    const newTask = () => proxyTest({ host, port, protocol })
                    tasks.push(newTask)
                }

            }
        }

        const totalTasks = tasks.length

        let cancelTimeout: NodeJS.Timeout

        const interval = setInterval(() => {
            console.log(`${tasks.length}/${totalTasks} in queue`)
            if (tasks.length === 0 && !cancelTimeout) {
                cancelTimeout = setTimeout(() => {
                    console.log("Cancel event emitted")
                    eventEmitter.emit("cancel")
                }, 120000)
                console.log("No tasks in queue. Wait 2 minutes for cancel.")
            }
        }, 60000)

        const worker = (workerIndex: number) => {
            return new Promise<void>((resolve, reject) => {
                const cancelListener = () => {
                    console.log(`Worker ${workerIndex} rejection on 'cancel' event`)
                    reject(new Error(`Worker ${workerIndex} cancelled`))
                }
                eventEmitter.on('cancel', cancelListener)

                const executeTask = () => {
                    if (tasks.length > 0) {
                        const task = tasks.pop()
                        task().then(res => {
                            const { name, protocol, host, port, errorResult, okResult } = res
                            const proxyURL = `socks${protocol}://${host}:${port}`
                            this.saveTestRunResult(res)
                                .then(() => console.log(`worker ${workerIndex}: ${name} ${proxyURL} ${okResult ? "OK" : ''}${errorResult ? errorResult.message : ''}`))
                                .catch((err) => console.log(`worker ${workerIndex}: ${name} ${proxyURL} ${err.message}`))

                        }
                        ).catch(error => {
                            console.log(`Worker ${workerIndex} error ${error.message}`)
                        }).finally(() => {
                            executeTask()
                        })
                    } else {
                        eventEmitter.off('cancel', cancelListener)
                        console.log(`Worker ${workerIndex} finished`)
                        resolve()
                    }
                }
                executeTask()
            })
        }

        const workers = Array(workersCount)
            .fill(null)
            .map((_, i) => worker(i).catch(err => console.log(err.message)))

        await Promise.all(workers);
        if (cancelTimeout) clearTimeout(cancelTimeout);
        clearInterval(interval);

    }

}

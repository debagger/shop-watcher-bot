import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Mutation,
  Args,
  Subscription} from "@nestjs/graphql";
import {
  ProxyTesterState,
  ProxyTesterWorkerState,
} from "./proxy-tester-state.class";
import { ProxyTesterService } from "./proxy-tester.service";
import { WorkerResult } from "./worker-result.class";

@Resolver((type) => ProxyTesterWorkerState)
export class ProxyTesterResolver {
  constructor(private readonly proxyTesterService: ProxyTesterService) {}

  @Query((returns) => ProxyTesterWorkerState)
  proxyTesterWorkerState() {
    const state = new ProxyTesterState();
    state.isStarted = this.proxyTesterService.isStarted;
    return state;
  }

  @ResolveField((type) => [ProxyTesterWorkerState])
  workers(@Parent() state: ProxyTesterWorkerState) {
    return this.proxyTesterService.workers.map((worker) => {
      const result = new ProxyTesterWorkerState();
      result.workerId = worker.workerId;
      if(worker.currentTask){
        result.currentTask = worker.currentTask.description
      }
      
      return result;
    });
  }

  @Mutation(returns=>Boolean)
  run() {
    this.proxyTesterService.run();
    return true
  }

  @Mutation(returns=>Boolean)
  stop() {
    this.proxyTesterService.stop();
    return false
  }

  @Subscription(returns=>WorkerResult)
  onTaskFinish(){
    return this.proxyTesterService.pubSub.asyncIterator("newTaskResult")
  }

}

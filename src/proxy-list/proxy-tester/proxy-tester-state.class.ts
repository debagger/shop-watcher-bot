import { ObjectType, Field, Int } from "@nestjs/graphql";
import {} from "graphql";

@ObjectType()
export class ProxyTesterWorkerTask {
  @Field()
  host: string;

  @Field((type) => Int)
  port: number;

  @Field()
  protocol: string;

  @Field()
  name: string;
}

@ObjectType()
export class ProxyTesterWorkerState {
  @Field((type) => Int)
  workerId: number;

  @Field(type=>ProxyTesterWorkerTask, {nullable:true})
  currentTask:ProxyTesterWorkerTask
}

@ObjectType()
export class ProxyTesterState {
  @Field()
  isStarted: boolean;

  @Field((type) => [ProxyTesterWorkerState])
  workers: ProxyTesterWorkerState[];
}

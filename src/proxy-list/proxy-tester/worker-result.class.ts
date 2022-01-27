import {
  ObjectType,
  Int,
  Field
} from "@nestjs/graphql";
import { ProxyTestRun } from "src/entities";


@ObjectType()
export class WorkerResult {
  @Field(type => Int)
  workerId: number;

  @Field(type => ProxyTestRun)
  result: ProxyTestRun;
}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ProxyListSource,
  ProxyListUpdate,
  Proxy,
  ProxyTestRun,
  ProxyTestType,
  ProxySourcesView,
} from "../entities";
import { ProxyTesterService } from "./proxy-tester.service";
import { ProxyTesterResolver } from "./proxy-tester.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProxyListSource,
      ProxyListUpdate,
      Proxy,
      ProxyTestRun,
      ProxyTestType,
      ProxySourcesView,
    ]),
  ],
  providers: [ProxyTesterService, ProxyTesterResolver],
})
export class ProxyTesterModule {}

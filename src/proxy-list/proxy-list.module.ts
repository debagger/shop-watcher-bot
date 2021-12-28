import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BrowserManagerModule } from "src/browser-manager/browser-manager.module";
import {
  ProxyListSource,
  ProxyListUpdate,
  Proxy,
  ProxyTestRun,
  ProxyTestType,
} from "src/entities";
import { ProxyListSourcesService } from "./proxy-list-sources/proxy-list-sources.service";
import { ProxyListUpdaterService } from "./proxy-list-updater/proxy-list-updater.service";
import { ProxyTesterService } from "./proxy-tester/proxy-tester.service";

@Module({
  imports: [ BrowserManagerModule,
    TypeOrmModule.forFeature([
      ProxyListSource,
      ProxyListUpdate,
      Proxy,
      ProxyTestRun,
      ProxyTestType,
    ]),
  ],
  providers: [
    ProxyListSourcesService,
    ProxyListUpdaterService,
    ProxyTesterService,
  ],
})
export class ProxyListModule implements OnModuleInit {
  constructor(
    private proxyUpdater: ProxyListUpdaterService,
    private proxyTester: ProxyTesterService
  ) {}
  async onModuleInit() {
    // await this.proxyUpdater.updateSource(1)
    await this.proxyUpdater.updateAllSources();
    // await this.proxyTester.checkAllProxies();
  }
}

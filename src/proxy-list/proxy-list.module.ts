import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BrowserManagerModule } from "src/browser-manager/browser-manager.module";
import {
  ProxyListSource,
  ProxyListUpdate,
  Proxy,
  ProxyTestRun,
  ProxyTestType,
  ProxySourcesView,
} from "../entities";
import { ProxyListSourcesService } from "./proxy-list-sources/proxy-list-sources.service";
import { ProxyListUpdaterService } from "./proxy-list-updater/proxy-list-updater.service";
import { ProxyTesterService } from "./proxy-tester/proxy-tester.service";
import { ProxyListSourceResolver } from './proxy-list-source.resolver';
import { ProxyResolver } from './proxy.resolver';
import { ProxyListUpdateResolver } from './proxy-list-update.resolver';
import { ProxyTesterResolver } from "./proxy-tester/proxy-tester.resolver";

@Module({
  imports: [ BrowserManagerModule,    
    TypeOrmModule.forFeature([
      ProxyListSource,
      ProxyListUpdate,
      Proxy,
      ProxyTestRun,
      ProxyTestType,
      ProxySourcesView
    ]),
  ],
  providers: [
    ProxyListSourcesService,
    ProxyListUpdaterService,
    ProxyTesterService,
    ProxyListSourceResolver,
    ProxyResolver,
    ProxyListUpdateResolver,
    ProxyTesterResolver
  ],
})
export class ProxyListModule implements OnModuleInit {
  constructor(
    private proxyUpdater: ProxyListUpdaterService,
    private proxyTester: ProxyTesterService
  ) {}
  async onModuleInit() {
    // await this.proxyUpdater.updateSource(4)
    // await this.proxyUpdater.updateAllSources();    
  }
}

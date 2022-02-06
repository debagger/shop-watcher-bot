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
import { ProxyListSourcesService } from "./proxy-list-sources.service";
import { ProxyListUpdaterService } from "./proxy-list-updater.service";
import { ProxyListSourceResolver } from './proxy-list-source.resolver';
import { ProxyResolver } from './proxy.resolver';
import { ProxyListUpdateResolver } from './proxy-list-update.resolver';
import { SocksProxyNetSourceService } from "./sources/socks-proxy-net.service";
import { HidemyNameSourceService } from "./sources/hidemy-name.service";
import { SpysOneSourceService } from "./sources/spys-one.service";
import { FreeProxyCzSourceService } from "./sources/free-proxy-cz.service";


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
    FreeProxyCzSourceService,
    SpysOneSourceService,
    HidemyNameSourceService,
    SocksProxyNetSourceService,
    ProxyListSourcesService,
    ProxyListUpdaterService,
    ProxyListSourceResolver,
    ProxyResolver,
    ProxyListUpdateResolver,
  ],
})
export class ProxyListModule implements OnModuleInit {
  constructor(
    private proxyUpdater: ProxyListUpdaterService,
  ) {}
  async onModuleInit() {
    // await this.proxyUpdater.updateSource(3)
    // await this.proxyUpdater.updateAllSources();    
  }
}

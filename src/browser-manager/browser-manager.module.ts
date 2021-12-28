import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proxy, ProxyTestRun, ProxyListUpdate } from './../entities';
import { BrowserManagerService } from './browser-manager.service';
import { BrowserManagerResolver } from './browser-manager.resolver';
import { KnownHostsResolver } from './known-hosts.resolver';

@Module({
  imports:[TypeOrmModule.forFeature([Proxy, ProxyTestRun, ProxyListUpdate])],
  providers: [BrowserManagerService, BrowserManagerResolver, KnownHostsResolver],
  exports: [BrowserManagerService]
})
export class BrowserManagerModule {}

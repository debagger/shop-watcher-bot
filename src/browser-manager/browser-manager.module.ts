import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proxy, ProxyTestRun, ProxyListUpdate } from './../entities';
import { BrowserManagerService } from './browser-manager.service';

@Module({
  imports:[TypeOrmModule.forFeature([Proxy, ProxyTestRun, ProxyListUpdate])],
  providers: [BrowserManagerService],
  exports: [BrowserManagerService]
})
export class BrowserManagerModule {}

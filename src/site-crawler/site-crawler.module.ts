import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserManagerModule } from 'src/browser-manager/browser-manager.module';
import { BrowserManagerService } from 'src/browser-manager/browser-manager.service';
import { Proxy, ProxyListUpdate, ProxyTestRun } from 'src/entities';
import { SiteCrawlerService } from './site-crawler.service';

@Module({
 imports: [BrowserManagerModule],
  providers: [SiteCrawlerService],
  exports: [SiteCrawlerService]
})
export class SiteCrawlerModule {}

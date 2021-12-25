import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proxy, ProxyListUpdate, ProxyTestRun } from 'src/entities';
import { SiteCrawlerService } from './site-crawler.service';

@Module({
  imports:[TypeOrmModule.forFeature([Proxy, ProxyTestRun, ProxyListUpdate])],
  providers: [SiteCrawlerService],
  exports: [SiteCrawlerService]
})
export class SiteCrawlerModule {}

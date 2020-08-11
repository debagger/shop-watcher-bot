import { Module } from '@nestjs/common';
import { SiteCrawlerService } from './site-crawler.service';

@Module({
  providers: [SiteCrawlerService],
  exports: [SiteCrawlerService]
})
export class SiteCrawlerModule {}

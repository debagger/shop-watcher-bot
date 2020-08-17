import { Module } from "@nestjs/common";
import { LinkScannerService } from "./link-scanner.service";
import { ChatDataModule } from "../chat-data/chat-data.module";
import { SiteCrawlerModule } from "../site-crawler/site-crawler.module";
import {CqrsModule} from '@nestjs/cqrs'
import { LinkGenerator } from "./link-generator.provider";
@Module({
  imports: [ChatDataModule, SiteCrawlerModule, CqrsModule],
  providers: [LinkScannerService, LinkGenerator],
})
export class LinkScannerModule {}

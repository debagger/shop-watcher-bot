import { Module } from "@nestjs/common";
import { LinkScannerService } from "./link-scanner.service";
import { ChatDataService } from "src/chat-data/chat-data.service";
import { ChatDataModule } from "src/chat-data/chat-data.module";
import { SiteCrawlerModule } from "src/site-crawler/site-crawler.module";
import { TelegramBotModule } from "src/telegram-bot/telegram-bot.module";
import {CqrsModule} from '@nestjs/cqrs'
@Module({
  imports: [ChatDataModule, SiteCrawlerModule, CqrsModule],
  providers: [LinkScannerService],
})
export class LinkScannerModule {}

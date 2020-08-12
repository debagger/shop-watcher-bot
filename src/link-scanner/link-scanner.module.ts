import { Module } from "@nestjs/common";
import { LinkScannerService } from "./link-scanner.service";
import { ChatDataService } from "src/chat-data/chat-data.service";
import { ChatDataModule } from "src/chat-data/chat-data.module";
import { SiteCrawlerModule } from "src/site-crawler/site-crawler.module";
import { TelegramBotService } from "src/telegram-bot/telegram-bot.service";
import { TelegramBotModule } from "src/telegram-bot/telegram-bot.module";

@Module({
  imports: [ChatDataModule, SiteCrawlerModule, TelegramBotModule],
  providers: [LinkScannerService],
})
export class LinkScannerModule {}

import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { ConfigModule } from '@nestjs/config';
import { ChatDataModule } from 'src/chat-data/chat-data.module';
import { SiteCrawlerModule } from 'src/site-crawler/site-crawler.module';

@Module({imports:[ConfigModule, ChatDataModule, SiteCrawlerModule],
  providers: [TelegramBotService],
  exports:[TelegramBotService]
})
export class TelegramBotModule {
 
}

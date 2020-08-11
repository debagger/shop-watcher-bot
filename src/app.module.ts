import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { ConfigModule } from '@nestjs/config';
import { FileDbModule } from './file-db/file-db.module';
import { ChatDataModule } from './chat-data/chat-data.module';
import { SiteCrawlerModule } from './site-crawler/site-crawler.module';

@Module({
  imports: [TelegramBotModule, ConfigModule.forRoot(), FileDbModule, ChatDataModule, SiteCrawlerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

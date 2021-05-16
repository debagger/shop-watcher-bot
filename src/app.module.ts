import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { ConfigModule } from '@nestjs/config';
import { FileDbModule } from './file-db/file-db.module';
import { ChatDataModule } from './chat-data/chat-data.module';
import { SiteCrawlerModule } from './site-crawler/site-crawler.module';
import { LinkScannerModule } from './link-scanner/link-scanner.module';
import { AuthModule } from './auth/auth.module';
import { UserLinksModule } from './user-links/user-links.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [LoggerModule.forRoot(),
    TelegramBotModule,
  ConfigModule.forRoot(),
    FileDbModule,
    ChatDataModule,
    SiteCrawlerModule,
    LinkScannerModule,
    AuthModule,
    UserLinksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

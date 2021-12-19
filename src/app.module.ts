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
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ProxyListModule } from './proxy-list/proxy-list.module';
import * as Entities from './entities'


@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'perconaserver',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'bot',
      entities: Object.values(Entities),
      synchronize: true,
      // maxQueryExecutionTime: 1000,
      // logging: true,
      // logger: "file"
    }),
    LoggerModule.forRoot(),
    TelegramBotModule,
    ConfigModule.forRoot(),
    FileDbModule,
    ChatDataModule,
    SiteCrawlerModule,
    LinkScannerModule,
    AuthModule,
    UserLinksModule,
    ProxyListModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

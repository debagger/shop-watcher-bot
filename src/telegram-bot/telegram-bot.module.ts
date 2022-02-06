import { Module } from "@nestjs/common";
import { TelegramBotService } from "./telegram-bot.service";
import { ConfigModule } from "@nestjs/config";
import { ChatDataModule } from "../chat-data/chat-data.module";
import { SiteCrawlerModule } from "../site-crawler/site-crawler.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  TelegramBotAnswer,
  TelegramChatDialog,
  TelegramChatUser,
} from "../entities";
import { TelegramChatUserResolver } from "./telegram-user.resolver";

@Module({
  imports: [
    ConfigModule,
    ChatDataModule,
    SiteCrawlerModule,
    AuthModule,
    TypeOrmModule.forFeature([
      TelegramChatUser,
      TelegramChatDialog,
      TelegramBotAnswer
    ]),
  ],
  providers: [TelegramBotService, TelegramChatUserResolver],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}

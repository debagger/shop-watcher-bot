import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { ConfigModule } from '@nestjs/config';
import { ChatDataModule } from '../chat-data/chat-data.module';
import { SiteCrawlerModule } from '../site-crawler/site-crawler.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({imports:[ConfigModule, ChatDataModule, SiteCrawlerModule, AuthModule],
  providers: [TelegramBotService],
  exports:[TelegramBotService]
})
export class TelegramBotModule {
 
}

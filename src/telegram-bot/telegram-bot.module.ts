import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { ConfigModule } from '@nestjs/config';

@Module({imports:[ConfigModule],
  providers: [TelegramBotService]
})
export class TelegramBotModule {
 
}

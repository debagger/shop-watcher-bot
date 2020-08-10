import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { ConfigModule } from '@nestjs/config';
import { FileDbModule } from './file-db/file-db.module';

@Module({
  imports: [TelegramBotModule, ConfigModule.forRoot(), FileDbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

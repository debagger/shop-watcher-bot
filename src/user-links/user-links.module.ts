import { Module } from '@nestjs/common';
import { UserLinksService } from './user-links.service';
import { UserLinksController } from './user-links.controller';
import { AuthModule } from '../auth/auth.module';
import { ChatDataModule } from '../chat-data/chat-data.module';

@Module({
  imports:[ChatDataModule],
  providers: [UserLinksService],
  controllers: [UserLinksController]
})
export class UserLinksModule {}

import { Module } from "@nestjs/common";
import { ChatDataService } from "./chat-data.service";
import { ConfigModule } from "@nestjs/config";
import { ChatDataStorageModule } from "src/chat-data-storage/chat-data-storage.module";

@Module({
  imports: [ChatDataStorageModule, ConfigModule],
  providers: [ChatDataService],
  exports: [ChatDataService],
})
export class ChatDataModule {}

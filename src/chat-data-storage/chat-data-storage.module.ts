import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatDataEntity } from "src/entities/chat-data.entity";
import { ChatDataDBStorageService } from "./db-storage.service";

@Module({imports:[ConfigModule, TypeOrmModule.forFeature([ChatDataEntity])],
  providers: [ChatDataDBStorageService],
  exports: [ChatDataDBStorageService],
})
export class ChatDataStorageModule {}

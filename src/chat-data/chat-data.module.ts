import { Module } from "@nestjs/common";
import { ChatDataService } from "./chat-data.service";
import { FileDbModule } from "../file-db/file-db.module";

@Module({
  imports: [FileDbModule],
  providers: [ChatDataService],
  exports: [ChatDataService],
})
export class ChatDataModule {}

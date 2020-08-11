import { Module } from "@nestjs/common";
import { FileDbService } from "./file-db.service";
import { ConfigModule } from "@nestjs/config";

@Module({imports:[ConfigModule],
  providers: [FileDbService],
  exports: [FileDbService],
})
export class FileDbModule {}

import { Module } from '@nestjs/common';
import { FileDbService } from './file-db.service';

@Module({
  providers: [FileDbService]
})
export class FileDbModule {}

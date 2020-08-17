import { Test, TestingModule } from '@nestjs/testing';
import { FileDbService } from './file-db.service';
import { ConfigModule } from '@nestjs/config';

describe('FileDbService', () => {
  let service: FileDbService;

  beforeEach(async () => {
    process.env["CHATS_DATA_DIR"] = "C:\\Projects\\shop-watcher-bot\\chats";
    const module: TestingModule = await Test.createTestingModule({imports:[ConfigModule],
      providers: [FileDbService],
    }).compile();

    service = module.get<FileDbService>(FileDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

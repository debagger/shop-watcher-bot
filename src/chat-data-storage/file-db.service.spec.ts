import { Test, TestingModule } from '@nestjs/testing';
import { ChatDataFileStorageService } from './file-storage.service';
import { ConfigModule } from '@nestjs/config';

describe('FileDbService', () => {
  let service: ChatDataFileStorageService;

  beforeEach(async () => {
    process.env["CHATS_DATA_DIR"] = "C:\\Projects\\shop-watcher-bot\\chats";
    const module: TestingModule = await Test.createTestingModule({imports:[ConfigModule],
      providers: [ChatDataFileStorageService],
    }).compile();

    service = module.get<ChatDataFileStorageService>(ChatDataFileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

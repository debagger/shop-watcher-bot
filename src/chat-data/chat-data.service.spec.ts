import { Test, TestingModule } from '@nestjs/testing';
import { ChatDataService } from './chat-data.service';

describe('ChatDataService', () => {
  let service: ChatDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatDataService],
    }).compile();

    service = module.get<ChatDataService>(ChatDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

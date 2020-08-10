import { Test, TestingModule } from '@nestjs/testing';
import { FileDbService } from './file-db.service';

describe('FileDbService', () => {
  let service: FileDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileDbService],
    }).compile();

    service = module.get<FileDbService>(FileDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

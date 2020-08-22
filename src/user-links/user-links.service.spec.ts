import { Test, TestingModule } from '@nestjs/testing';
import { UserLinksService } from './user-links.service';

describe('UserLinksService', () => {
  let service: UserLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserLinksService],
    }).compile();

    service = module.get<UserLinksService>(UserLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

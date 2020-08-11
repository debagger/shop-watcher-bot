import { Test, TestingModule } from '@nestjs/testing';
import { SiteCrawlerService } from './site-crawler.service';

describe('SiteCrawlerService', () => {
  let service: SiteCrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiteCrawlerService],
    }).compile();

    service = module.get<SiteCrawlerService>(SiteCrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

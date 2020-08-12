import { Test, TestingModule } from '@nestjs/testing';
import { LinkScannerService } from './link-scanner.service';

describe('LinkScannerService', () => {
  let service: LinkScannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinkScannerService],
    }).compile();

    service = module.get<LinkScannerService>(LinkScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

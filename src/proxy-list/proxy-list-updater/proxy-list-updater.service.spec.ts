import { Test, TestingModule } from '@nestjs/testing';
import { ProxyListUpdaterService } from './proxy-list-updater.service';

describe('ProxyListUpdaterService', () => {
  let service: ProxyListUpdaterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProxyListUpdaterService],
    }).compile();

    service = module.get<ProxyListUpdaterService>(ProxyListUpdaterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

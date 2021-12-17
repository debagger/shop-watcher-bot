import { Test, TestingModule } from '@nestjs/testing';
import { ProxyListSourcesService } from './proxy-list-sources.service';

describe('ProxyListSourcesService', () => {
  let service: ProxyListSourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProxyListSourcesService],
    }).compile();

    service = module.get<ProxyListSourcesService>(ProxyListSourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

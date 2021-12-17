import { Test, TestingModule } from '@nestjs/testing';
import { ProxyTesterService } from './proxy-tester.service';

describe('ProxyTesterService', () => {
  let service: ProxyTesterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProxyTesterService],
    }).compile();

    service = module.get<ProxyTesterService>(ProxyTesterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

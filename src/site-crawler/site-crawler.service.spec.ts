import { Test, TestingModule } from '@nestjs/testing';
import { SiteCrawlerService } from './site-crawler.service';
import { LoggerModule } from 'nestjs-pino';

describe('SiteCrawlerService', () => {
  let service: SiteCrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
      providers: [SiteCrawlerService],
    }).compile();

    service = module.get<SiteCrawlerService>(SiteCrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should extract simple page', async () => {
    const result = await service.getData('https://www.zara.com/ru/ru/%D0%BF%D0%B0%D0%BB%D1%8C%D1%82%D0%BE-%D0%B2-%D0%BC%D1%83%D0%B6%D1%81%D0%BA%D0%BE%D0%BC-%D1%81%D1%82%D0%B8%D0%BB%D0%B5-%D0%B8%D0%B7-%D1%81%D0%BC%D0%B5%D1%81%D0%BE%D0%B2%D0%BE%D0%B9-%D1%88%D0%B5%D1%80%D1%81%D1%82%D0%B8-p09397754.html?v1=152022848&v2=1882177');
    expect(result).toHaveProperty("type", "simple")
    expect(result).toHaveProperty("name", "ПАЛЬТО В МУЖСКОМ СТИЛЕ ИЗ СМЕСОВОЙ ШЕРСТИ")
  })
  it('should extract multicolor page', async () => {
    const result = await service.getData('https://www.zara.com/ru/ru/%D0%B1%D1%80%D1%8E%D0%BA%D0%B8-%D1%81-%D0%B2%D1%8B%D1%81%D0%BE%D0%BA%D0%BE%D0%B9-%D0%BF%D0%BE%D1%81%D0%B0%D0%B4%D0%BA%D0%BE%D0%B9-p07901432.html?v1=120500928');
    expect(result).toHaveProperty("type", "multicolors")
    if (result.type === 'multicolors') {

      expect(result).toHaveProperty("name", "БРЮКИ С ВЫСОКОЙ ПОСАДКОЙ")
      expect(Array.isArray(result.colors)).not.toBeFalsy()
      expect(result.colors.length > 0).not.toBeFalsy()
      for(let color of result.colors){
        expect(color.sizes.length).toBeGreaterThan(0);
      }
    }
  })
});

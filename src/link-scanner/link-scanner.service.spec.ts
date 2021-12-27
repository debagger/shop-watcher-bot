import { Test, TestingModule } from "@nestjs/testing";
import { LinkScannerService } from "./link-scanner.service";
import { LinkGenerator } from "./link-generator.provider";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import { ChatDataService } from "../chat-data/chat-data.service";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { NewSizeExist } from "./new-size-exist.event";
import { MockFunctionMetadata, ModuleMocker } from "jest-mock";

const moduleMocker = new ModuleMocker(global);

describe("LinkScannerService", () => {
  let service: LinkScannerService;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        LinkScannerService,
        LinkGenerator,
      ],
    }).useMocker((token)=>{
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);
        return new Mock();
      }
    }).compile();

    service = module.get<LinkScannerService>(LinkScannerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return new size exist for simple page", async () => {
    const prevSizes =[{ size: "XL", disabled: true }]
    const prevRes = {
      name: 'qqq',
      colors: [{
        color: { name: 'COLOR1', code: '' },
        sizes: prevSizes
      }]
    }


const newSizes = [{ size: "XL", disabled: true }] 
    const newRes = {
      name: 'qqq',
      colors: [{
        color: { name: 'COLOR1', code: '' },
        sizes: newSizes
      }]
    }

    expect(service.isItemReturnOnSale({ color: "COLOR1", size: "XL" }, prevRes, newRes)).toBeFalsy()

    prevSizes[0].disabled = true
    newSizes[0].disabled = false
    expect(service.isItemReturnOnSale({ color: "COLOR1", size: "XL" }, prevRes, newRes)).toBeTruthy()
    expect(service.isItemReturnOnSale({ color: "COLOR2", size: "XL" }, prevRes, newRes)).toBeFalsy()

    prevSizes[0].disabled = false
    newSizes[0].disabled = true
    expect(service.isItemReturnOnSale({ color: "COLOR1", size: "XL" }, prevRes, newRes)).toBeFalsy()
    
    prevSizes[0] = {size:"XL", disabled:undefined} 
    newSizes[0] = {size:'XL', disabled: false}
    expect(service.isItemReturnOnSale({ color: "COLOR1", size: "XL" }, prevRes, newRes)).toBeTruthy()
    expect(service.isItemReturnOnSale({ color: "COLOR2", size: "XL" }, prevRes, newRes)).toBeFalsy()

    prevSizes.length = 0
    newSizes[0] = {size:'XL', disabled: false}
    expect(service.isItemReturnOnSale({ color: "COLOR1", size: "XL" }, prevRes, newRes)).toBeTruthy()
    expect(service.isItemReturnOnSale({ color: "COLOR2", size: "XL" }, prevRes, newRes)).toBeFalsy()

  })


});

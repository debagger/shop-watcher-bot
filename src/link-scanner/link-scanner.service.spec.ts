import { Test, TestingModule } from "@nestjs/testing";
import { LinkScannerService } from "./link-scanner.service";
import { ChatDataModule } from "../chat-data/chat-data.module";
import { SiteCrawlerModule } from "../site-crawler/site-crawler.module";
import { LinkGenerator } from "./link-generator.provider";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import { ChatDataService } from "../chat-data/chat-data.service";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { NewSizeExist } from "./new-size-exist.event";

describe("LinkScannerService", () => {
  let service: LinkScannerService;
  let eventBus: EventBus;
  const getChatDataServiceMock = () => {
    return {
      getChatIds() {
        console.log("getChatIds");
        return Promise.resolve([1]);
      },
      links: {
        links: {
          "https://www.zara.com/ru/ru/1.html": {
            lastCheckResult: {
              name: "1",
              sizes: [
                { size: "XS", disabled: false },
                { size: "XL", disabled: true },
              ],
            },
            trackFor: ["XL", "XS"],
          },
        },
      },
      getChat() {
        console.log("getChat");
        return this.links;
      },
    };
  };

  const getSiteCrawlerServiceMock = () => {
    return {
      getData: (...args) => {
        console.log("GetData", args);
        return Promise.resolve({
          name: "1",
          sizes: [
            { size: "XL", disabled: false },
            { size: "XS", disabled: false },
          ],
        });
      },
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        LinkScannerService,
        LinkGenerator,
        { provide: ChatDataService, useFactory: getChatDataServiceMock },
        { provide: SiteCrawlerService, useFactory: getSiteCrawlerServiceMock },
      ],
    }).compile();

    service = module.get<LinkScannerService>(LinkScannerService);
    eventBus = module.get<EventBus>(EventBus);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return new size", async () => {
    jest.spyOn(eventBus, "publish").mockImplementation((e) => {
      console.log(e);
      expect(e).toEqual(<NewSizeExist>{
        chatId: 1,
        link: "https://www.zara.com/ru/ru/1.html",
        newSizes: ["XL"],
      });
    });
    await service.checkLink("https://www.zara.com/ru/ru/1.html", 1);
  });
});

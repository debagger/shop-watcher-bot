import { Test, TestingModule } from "@nestjs/testing";
import { LinkScannerService } from "./link-scanner.service";
import { LinkGenerator } from "./link-generator.provider";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import { ChatDataService } from "../chat-data/chat-data.service";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { NewSizeExist } from "./new-size-exist.event";

describe("LinkScannerService", () => {
  const getChatDataServiceMock = () => {
    return {
      getChatIds() {
        return Promise.resolve([1]);
      },
      chat: {
        links: {
          "https://www.zara.com/ru/ru/1.html": {
            lastCheckResult: {
              name: "1",
              sizes: [
                { size: "XL", disabled: true },
                { size: "XS", disabled: false },
              ],
            },
            trackFor: ["XL", "XS"],
          },
        },
      },
      getChat() {
        return Promise.resolve(this.chat);
      },
    };
  };

  const getSiteCrawlerServiceMock = () => {
    return {
      sizes: [
        { size: "XL", disabled: false },
        { size: "XS", disabled: false },
      ],
      getData(link) {
        return Promise.resolve({
          name: "1",
          sizes: this.sizes,
        });
      },
    };
  };

  let service: LinkScannerService;
  let eventBus: EventBus;
  let chatDataServiceMock: ReturnType<typeof getChatDataServiceMock>;
  let siteCrawlerServiceMock: ReturnType<typeof getSiteCrawlerServiceMock>;

  beforeEach(async () => {
    chatDataServiceMock = getChatDataServiceMock();
    siteCrawlerServiceMock = getSiteCrawlerServiceMock();
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        LinkScannerService,
        LinkGenerator,
        { provide: ChatDataService, useValue: chatDataServiceMock },
        { provide: SiteCrawlerService, useValue: siteCrawlerServiceMock },
      ],
    }).compile();

    service = module.get<LinkScannerService>(LinkScannerService);
    eventBus = module.get<EventBus>(EventBus);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return new size exist", async () => {
    let event: NewSizeExist;
    jest.spyOn(eventBus, "publish").mockImplementation((e: NewSizeExist) => {
      event = e;
    });
    await service.checkLink("https://www.zara.com/ru/ru/1.html", 1);

    expect(event).toEqual(<NewSizeExist>{
      chatId: 1,
      link: "https://www.zara.com/ru/ru/1.html",
      newSizes: ["XL"],
    });

    expect(siteCrawlerServiceMock.sizes).toEqual(
      chatDataServiceMock.chat.links["https://www.zara.com/ru/ru/1.html"]
        .lastCheckResult.sizes
    );
  });

  it("should return new size exist 1", async () => {
    chatDataServiceMock.chat.links[
      "https://www.zara.com/ru/ru/1.html"
    ].lastCheckResult.sizes = [
      { size: "S", disabled: false },
      { size: "L", disabled: true },
      { size: "XL", disabled: true },
      { size: "XS", disabled: true },
    ];
    
    chatDataServiceMock.chat.links[
      "https://www.zara.com/ru/ru/1.html"
    ].trackFor = ["XL", "XS", "M"];

    siteCrawlerServiceMock.sizes = [
      { size: "M", disabled: false },
      { size: "S", disabled: true },
      { size: "L", disabled: false },
      { size: "XL", disabled: false },
      { size: "XS", disabled: false },
    ];

    let event: NewSizeExist;
    jest.spyOn(eventBus, "publish").mockImplementation((e: NewSizeExist) => {
      event = e;
    });
    await service.checkLink("https://www.zara.com/ru/ru/1.html", 1);

    expect(event).toEqual(<NewSizeExist>{
      chatId: 1,
      link: "https://www.zara.com/ru/ru/1.html",
      newSizes: ["M", "XL", "XS"],
    });

    expect(siteCrawlerServiceMock.sizes).toEqual(
      chatDataServiceMock.chat.links["https://www.zara.com/ru/ru/1.html"]
        .lastCheckResult.sizes
    );
  });
});

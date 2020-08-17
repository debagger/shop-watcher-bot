import { Test, TestingModule } from "@nestjs/testing";
import { TelegramBotService } from "./telegram-bot.service";
import { ConfigModule } from "@nestjs/config";
import { ChatDataModule } from "../chat-data/chat-data.module";
import { SiteCrawlerModule } from "../site-crawler/site-crawler.module";

describe("TelegramBotService", () => {
  let service: TelegramBotService;

  beforeEach(async () => {
    process.env["CHATS_DATA_DIR"] = "C:\\Projects\\shop-watcher-bot\\chats";
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, ChatDataModule, SiteCrawlerModule],
      providers: [TelegramBotService],
    }).compile();

    service = module.get<TelegramBotService>(TelegramBotService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});

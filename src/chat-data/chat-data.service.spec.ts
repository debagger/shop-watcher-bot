import { Test, TestingModule } from "@nestjs/testing";
import { ChatDataService } from "./chat-data.service";
import { FileDbModule } from "../chat-data-storage/chat-data-storage.module";
import { async } from "rxjs";

describe("ChatDataService", () => {
  let service: ChatDataService;

  beforeEach(async () => {
    process.env["CHATS_DATA_DIR"] = "C:\\Projects\\shop-watcher-bot\\chats";
    const module: TestingModule = await Test.createTestingModule({
      imports: [FileDbModule],
      providers: [ChatDataService],
    }).compile();

    service = module.get<ChatDataService>(ChatDataService);
  });

  afterEach(async () => {
    process.env["CHATS_DATA_DIR"] = undefined;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});

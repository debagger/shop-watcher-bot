import { Injectable } from "@nestjs/common";
import { ChatDataService } from "src/chat-data/chat-data.service";
import { left, right, Either } from "fp-ts/Either";
import { ChatLinks, Link } from "src/file-db/chat-links.interface";
import { SiteCrawlerService } from "src/site-crawler/site-crawler.service";

@Injectable()
export class UserLinksService {
  constructor(
    private chatData: ChatDataService,
    private sitecrawler: SiteCrawlerService
  ) {}

  async getLinks(chatId: number) {
    const chat = await this.chatData.getChat(chatId);
    return Object.keys(chat.links)
      .filter((i) => i.startsWith("https://www.zara.com"))
      .map((i) => {
        return { link: i, ...(<Link>chat.links[i]) };
      });
  }

  async addNewLink(chatId: number, link: string) {
    if (link && link.startsWith("https://www.zara.com")) {
      const trimmedLink = link.split("?")[0];
      const chat = await this.chatData.getChat(chatId);
      if (chat.links[trimmedLink]) return Error("Link exist");
      const scanResult = await this.sitecrawler.getData(trimmedLink);
      const res: Link = { lastCheckResult: scanResult, trackFor: [] };
      chat.links[trimmedLink] = res;
      return { link: trimmedLink, ...res };
    }
  }
}

import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Telegram } from "telegraf";
import { SiteCrawlerService } from "src/site-crawler/site-crawler.service";
import { ChatDataService } from "src/chat-data/chat-data.service";
import { TelegramBotService } from "src/telegram-bot/telegram-bot.service";
import { Link } from "src/file-db/chat-links.interface";
import { EventBus } from "@nestjs/cqrs";
import { NewSizeExist } from "./new-size-exist.event";

const sleep = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

@Injectable()
export class LinkScannerService implements OnApplicationBootstrap {
  constructor(
    private Chat: ChatDataService,
    private spider: SiteCrawlerService,
    private eventBus: EventBus
  ) {}


  async onApplicationBootstrap() {
    await this.runCheckAll();
  }

  async runCheckAll() {
    const checkAll = async () => {
      while (true) {
        const chats = await this.Chat.getChatsIds();
        for (const chatId of chats) {
          await this.makeCheck(chatId);
        }
        const delay = (Math.random() + 1) * 10 * 60 * 1000;
        console.log(
          `Wait ${Math.floor(delay / 1000)} sec before next iteration.`
        );
        await sleep(delay);
      }
    };

    setTimeout(checkAll, 1000);
  }

  async makeCheck(chatId: number) {
    const chat = await this.Chat.getChat(chatId);
    const links = chat.links;

    const zaraLinks = Object.keys(links).filter((i) =>
      i.startsWith("https://www.zara.com/")
    );

    for (const link of zaraLinks) {
      try {
        await this.checkLink(link, chatId);
      } catch (err) {}
      await sleep(Math.random() * 10 * 1000 + 1000);
    }
  }

  async checkLink(link: string, chatId: number) {
    const newData = await this.spider.getData(link);
    console.log(newData.name);
    const chat = await this.Chat.getChat(chatId);
    const links = chat.links;
    if (newData) {
      const linkData = links[link] as Link;
      if (
        linkData.lastCheckResult &&
        linkData.trackFor &&
        linkData.trackFor.length > 0
      ) {
        const oldSizeExist = linkData.lastCheckResult.sizes
          .filter((s) => linkData.trackFor?.includes(s.size) && !s.disabled)
          .map((s) => s.size);

        const sizeExist = newData.sizes
          .filter(
            (s) =>
              !oldSizeExist.includes(s.size) &&
              linkData.trackFor?.includes(s.size) &&
              !s.disabled
          )
          .map((s) => s.size);
        if (sizeExist.length > 0) {
          this.eventBus.publish(new NewSizeExist(chatId, link, sizeExist));
        }
      }
      linkData.lastCheckResult = newData;
      chat.save();
    }
  }
}

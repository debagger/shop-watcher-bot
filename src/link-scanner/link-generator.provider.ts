import { Injectable } from "@nestjs/common";
import { ChatDataService } from "../chat-data/chat-data.service";

const sleep = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

@Injectable() export class LinkGenerator {
  constructor(private Chat: ChatDataService) { }

  async *[Symbol.asyncIterator]() {
    while (true) {
      const chats = await this.Chat.getChatsIds();
      if (chats.length === 0) {
        await sleep(10000)
        continue
      }
      for (const chatId of chats) {
        const chat = await this.Chat.getChat(chatId);
        const zaraLinks = Object.keys(chat.links).filter((i) =>
          i.startsWith("https://www.zara.com/")
        );
        for (const link of zaraLinks) {
          yield { chatId, link }
          await sleep(Math.random() * 10 * 1000 + 1000);
        }
        const delay = (Math.random() + 1) * 10 * 60 * 1000;
        console.log(
          `Wait ${Math.floor(delay / 1000)} sec before next iteration.`
        );
        await sleep(delay);
      }
    }
  }
}
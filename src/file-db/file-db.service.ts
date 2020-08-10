import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, promises } from "fs";
const { readFile, writeFile, opendir } = promises;
import { join, resolve } from "path";
import { ChatLinks } from "./chat-links.interface";

@Injectable()
export class FileDbService {
    
  private readonly path = resolve("./", "chats");

  async getChatsIds(): Promise<number[]> {
    const path = this.path;
    const dir = await opendir(path);
    const result: number[] = [];
    for await (const dirent of dir) {
      if (dirent.isDirectory()) {
        const сhatId = Number.parseInt(dirent.name);
        if (Number.isFinite(сhatId)) {
          result.push(сhatId);
        }
      }
    }
    return result;
  }

  async getChatLinks(chatId: Number): Promise<ChatLinks> {
    const path = join(this.path, `${chatId}`, "links.json");
    if (existsSync(path)) {
      const json = await readFile(path, "utf8");
      return JSON.parse(json.toString());
    }
    return {};
  }

  async saveChatLinks(chatId: Number, links: ChatLinks) {
    const path = join(this.path, `${chatId}`);
    if (!existsSync(path)) {
      mkdirSync(path);
    }
    const filePath = join(path, "links.json");
    const json = JSON.stringify(links, null, " ");
    await writeFile(filePath, json, "utf8");
  }
}

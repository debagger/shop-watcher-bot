import { Injectable } from "@nestjs/common";
import { existsSync, mkdirSync, promises } from "fs";
const { readFile, writeFile, opendir } = promises;
import { join, resolve } from "path";
import { ChatLinks } from "./chat-links.interface";
import { ConfigService } from "@nestjs/config";
import { ChatDataStorageInterface } from "./chat-data-storage.interface";

@Injectable()
export class ChatDataFileStorageService implements ChatDataStorageInterface {
  constructor(private config: ConfigService) {}
  private readonly path = resolve(this.config.get<string>("CHATS_DATA_DIR"));

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
      const fileContent = await readFile(path, "utf8");
      const result = JSON.parse(fileContent.toString());
      return result;
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

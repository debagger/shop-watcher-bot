import { Injectable } from "@nestjs/common";
import { Chat } from "./chat-data-keeper";
import { FileDbService } from "../file-db/file-db.service";
@Injectable()
export class ChatDataService {
  constructor(private db: FileDbService) {}

  private chats: { [key: number]: Chat } = {};

  public async getChat(chatId: number) {
    if (!this.chats[chatId]) {
      this.chats[chatId] = new Chat(chatId, this.db);
      await this.chats[chatId].load()
    }
    return this.chats[chatId];
  }

  public async getChatsIds() {
    return await this.db.getChatsIds();
  }
}

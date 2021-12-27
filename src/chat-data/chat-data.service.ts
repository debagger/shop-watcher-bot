import { Injectable } from "@nestjs/common";
import { Chat } from "./chat-data-keeper";
import { ChatDataDBStorageService } from "../chat-data-storage/db-storage.service";
@Injectable()
export class ChatDataService {
  constructor(private db: ChatDataDBStorageService) {}

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

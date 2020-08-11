import { Injectable } from "@nestjs/common";
import { Chat } from "./chat-data-keeper";
import { FileDbService } from "src/file-db/file-db.service";
@Injectable()
export class ChatDataService {
  constructor(private db: FileDbService) {}

  private chats: { [key: number]: Chat } = {};

  public async getChat(chatId: number) {
    if (!this.chats[chatId]) {
      this.chats[chatId] = new Chat(chatId, this.db);
      this.chats[chatId].links = await this.db.getChatLinks(chatId);
    }
    return this.chats[chatId];
  }

  public async getChatsIds() {
    return await this.db.getChatsIds();
  }
}

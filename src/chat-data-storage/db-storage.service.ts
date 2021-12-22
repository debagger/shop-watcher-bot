import { Injectable } from "@nestjs/common";
import { ChatLinks } from "./chat-links.interface";
import { ChatDataStorageInterface } from "./chat-data-storage.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { ChatDataEntity } from "src/entities";
import { Repository } from "typeorm";

@Injectable()
export class ChatDataDBStorageService implements ChatDataStorageInterface {
  constructor(@InjectRepository(ChatDataEntity) private chatDataRepo: Repository<ChatDataEntity>) {}

  async getChatsIds(): Promise<number[]> {
    const ids = await this.chatDataRepo.find({select:['chatId']})
    return ids.map(id=>id.chatId);
  }

  async getChatLinks(chatId: number): Promise<ChatLinks> {
      const data = await this.chatDataRepo.findOne(chatId)
      if(data)    return data.chatData;
      return {}
  }

  async saveChatLinks(chatId: number, links: ChatLinks): Promise<void> {
    let chatData = await this.chatDataRepo.findOne(chatId)
    if(!chatData) chatData = this.chatDataRepo.create({chatId})
    chatData.chatData = links
    await this.chatDataRepo.save(chatData)
  }
}

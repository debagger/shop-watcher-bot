import { ChatLinks } from "./chat-links.interface";

export interface ChatDataStorageInterface {
    getChatsIds(): Promise<number[]>
    getChatLinks(chatId: Number): Promise<ChatLinks>
    saveChatLinks(chatId: Number, links: ChatLinks): Promise<void>
}
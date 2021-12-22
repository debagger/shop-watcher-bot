import { ChatLinks } from "src/chat-data-storage/chat-links.interface";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class ChatDataEntity{

    @PrimaryColumn()
    chatId:number

    @Column('json')
    chatData: ChatLinks

}
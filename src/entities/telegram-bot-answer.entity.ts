import { Field, ObjectType, Int } from "@nestjs/graphql";
import { GraphQLJSON } from "graphql-scalars";
import { ChatLinks } from "src/chat-data-storage/chat-links.interface";
import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { TelegramChatDialog } from "./telegram-chat-dialod.entity";
import { TelegramChatUser } from "./telegram-user.entity";

@ObjectType()
@Entity()
export class TelegramBotAnswer{
    @Field(type=>Int)
    @PrimaryGeneratedColumn()
    id: number
    
    @Field()
    @Column()
    text:string

    @Field((type) => GraphQLJSON, {nullable: true})
    @Column({ type: "json", nullable: true })
    extra?: any

    @Field()
    @Column({ type: "datetime" })
    answerTime: Date;
   
    @ManyToOne(type=>TelegramChatDialog)
    dialog:TelegramChatDialog
}
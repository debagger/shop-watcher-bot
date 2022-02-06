import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { TelegramBotAnswer } from "./telegram-bot-answer.entity";
import { TelegramChatUser } from "./telegram-user.entity";

@ObjectType()
@Entity()
export class TelegramChatDialog{
    @Field(type=>Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type=>TelegramChatUser)
    @ManyToOne(type=>TelegramChatUser)
    from: TelegramChatUser

    @Field(type=>Int)
    @Column()
    chatId:number

    @Field()
    @Column()
    inputMessage:string

    @Field()
    @Column({ type: "datetime" })
    startTime: Date;

    @Field(type=>[TelegramBotAnswer], {nullable: true})
    @OneToMany(type=>TelegramBotAnswer, d=>d.dialog)
    answers:TelegramBotAnswer[]
}
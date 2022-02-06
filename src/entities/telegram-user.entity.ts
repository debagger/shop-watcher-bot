import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ChatLinks } from "src/chat-data-storage/chat-links.interface";
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity()
export class TelegramChatUser{
    @Field(type=>Int)
    @PrimaryColumn()
    id: number;

    @Field()
    @Column()
    first_name:string

    @Field()
    @Column()
    is_bot:boolean

    @Field({nullable:true})
    @Column({nullable:true})
    language_code?:string
    
    @Field({nullable:true})
    @Column({nullable:true})
    last_name?:string

    @Field({nullable:true})
    @Column({nullable:true})
    username?:string
}
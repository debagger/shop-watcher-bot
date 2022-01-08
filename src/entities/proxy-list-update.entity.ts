import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm'
import { ProxyListSource } from './proxy-list-source.entity'
import { Proxy } from './proxy.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from "graphql-scalars";

@ObjectType()
@Entity()
export class ProxyListUpdate {
    @Field(type=>Int)
    @PrimaryGeneratedColumn()
    id: number

    @Field()
    @Column({ type: 'datetime' })
    updateTime: Date

    @Field(type=>ProxyListSource)
    @ManyToOne(() => ProxyListSource, (source) => source.updates)
    source: ProxyListSource

    @Field(type=>[Proxy])
    @ManyToMany(() => Proxy, proxy => proxy.updates)
    @JoinTable()
    loadedProxies: Proxy[]

    @Field(type=>GraphQLJSON, {nullable: true})
    @Column('json', { nullable: true })
    error?: Error | Error[]

}
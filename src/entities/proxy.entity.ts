import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ProxyTestRun, ProxyListUpdate } from ".";
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity()
@Unique(['host','port'])
export class Proxy {
    @Field(type=>Int)
    @PrimaryGeneratedColumn()    
    id: number

    @Field()
    @Column()
    host: string

    @Field(type=>Int)
    @Column('integer')
    port: number

    @Field(type=>[ProxyListUpdate])
    @ManyToMany(() => ProxyListUpdate, update => update.loadedProxies)
    updates: ProxyListUpdate[]

    @Field(type=>[ProxyTestRun])
    @OneToMany(() => ProxyTestRun, testRun => testRun.testedProxy)
    testsRuns: ProxyTestRun[]
}
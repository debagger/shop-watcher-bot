import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, Unique, VirtualColumn } from "typeorm";
import { ProxyTestRun, ProxyListUpdate, ProxySourcesView } from ".";
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
    @ManyToMany(() => ProxyListUpdate, update => update.loadedProxies, { onDelete: 'CASCADE' })
    updates: ProxyListUpdate[]

    @Field(type=>[ProxyTestRun])
    @OneToMany(() => ProxyTestRun, testRun => testRun.testedProxy, { onDelete: 'CASCADE' })
    testsRuns: ProxyTestRun[]

    @OneToMany(() => ProxySourcesView, src => src.proxy)
    @Field(type => [ProxySourcesView])
    sources: ProxySourcesView[]


    @VirtualColumn({
        query: alias => `
    SELECT TIMESTAMPDIFF (HOUR, plu.updateTime, NOW())
    FROM proxy_list_update_loaded_proxies_proxy AS plu_pp
    LEFT JOIN proxy_list_update as plu ON plu.id=plu_pp.proxyListUpdateId
    WHERE plu_pp.proxyId=${alias}.id
    ORDER BY plu_pp.proxyListUpdateId DESC
    LIMIT 1
    `})
    lastSeenOnSourcesHoursAgo: number
}
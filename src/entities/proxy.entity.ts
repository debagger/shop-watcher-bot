import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ProxyTestRun, ProxyListUpdate } from ".";

@Entity()
@Unique(['host','port'])
export class Proxy {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    host: string

    @Column('integer')
    port: number

    @ManyToMany(() => ProxyListUpdate, update => update.loadedProxies)
    updates: ProxyListUpdate[]

    @OneToMany(() => ProxyTestRun, testRun => testRun.testedProxy)
    testsRuns: ProxyTestRun[]
}
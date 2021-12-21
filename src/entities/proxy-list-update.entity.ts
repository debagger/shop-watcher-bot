import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm'
import { ProxyListSource } from './proxy-list-source.entity'
import { Proxy } from './proxy.entity'

@Entity()
export class ProxyListUpdate {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'datetime' })
    updateTime: Date

    @ManyToOne(() => ProxyListSource, (source) => source.updates)
    source: ProxyListSource

    @ManyToMany(() => Proxy, proxy => proxy.updates)
    @JoinTable()
    loadedProxies: Proxy[]

    @Column('json', { nullable: true })
    error?: Error | Error[]

}
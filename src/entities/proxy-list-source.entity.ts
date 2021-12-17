import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProxyListUpdate } from './proxy-list-update.entity'
@Entity()
export class ProxyListSource {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ default: 3600, type: 'integer', unsigned: true })
    updateInterval: number;

    @OneToMany(type => ProxyListUpdate, update => update.source)
    updates: ProxyListUpdate[];
}
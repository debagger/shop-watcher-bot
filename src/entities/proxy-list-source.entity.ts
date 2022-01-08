import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProxyListUpdate } from './proxy-list-update.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity()
export class ProxyListSource {
    @Field(type=>Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ unique: true })
    name: string;

    @Field(type=>Int)
    @Column({ default: 3600, type: 'integer', unsigned: true })
    updateInterval: number;

    @Field(type=>[ProxyListUpdate])
    @OneToMany(type => ProxyListUpdate, update => update.source)
    updates: ProxyListUpdate[];
}
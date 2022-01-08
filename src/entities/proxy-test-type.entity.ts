import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ProxyTestRun } from './proxy-test-run.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql';


@ObjectType()
@Entity()
export class ProxyTestType {
    @Field(type=>Int)
    @PrimaryGeneratedColumn()
    id: number

    @Field()
    @Column({unique:true})
    name: string

    @Field(type=>[ProxyTestRun])
    @OneToMany(() => ProxyTestRun, testRun => testRun.testType)
    testRuns: ProxyTestRun[]
}
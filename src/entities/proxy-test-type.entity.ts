import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ProxyTestRun } from './proxy-test-run.entity'

@Entity()
export class ProxyTestType {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique:true})
    name: string

    @OneToMany(() => ProxyTestRun, testRun => testRun.testType)
    testRuns: ProxyTestRun[]
}
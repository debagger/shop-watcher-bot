import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Proxy, ProxyTestType } from ".";

@Entity()
export class ProxyTestRun {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'timestamp with time zone' })
    runTime: Date

    @Column('smallint')
    protocol: 4 | 5

    @ManyToOne(() => ProxyTestType, (testType) => testType.testRuns)
    testType: ProxyTestType

    @ManyToOne(() => Proxy, proxy => proxy.testsRuns)
    testedProxy: Proxy

    @Column({ type: 'jsonb', nullable: true })
    okResult?: any

    @Column({ type: 'jsonb', nullable: true })
    errorResult?: any

}
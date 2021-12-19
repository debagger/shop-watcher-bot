import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Proxy, ProxyTestType } from ".";

@Entity()
export class ProxyTestRun {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'datetime' })
    runTime: Date

    @Column('smallint')
    protocol: 4 | 5

    @ManyToOne(() => ProxyTestType, (testType) => testType.testRuns)
    testType: ProxyTestType

    @ManyToOne(() => Proxy, proxy => proxy.testsRuns)
    testedProxy: Proxy

    @Column({ type: 'json', nullable: true })
    okResult?: any

    @Column({ type: 'json', nullable: true })
    errorResult?: any

    @Column({ type: "int" })
    duration_ms: number

}
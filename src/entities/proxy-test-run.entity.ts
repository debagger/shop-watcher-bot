import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Proxy, ProxyTestType } from ".";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { GraphQLJSON } from "graphql-scalars";
@ObjectType()
@Entity()
export class ProxyTestRun {
  @Field((type) => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: "datetime" })
  runTime: Date;

  @Field()
  @Column("smallint")
  protocol: 4 | 5;

  @Field((type) => ProxyTestType)
  @ManyToOne(() => ProxyTestType, (testType) => testType.testRuns)
  testType: ProxyTestType;

  @Field((type) => Proxy)
  @ManyToOne(() => Proxy, (proxy) => proxy.testsRuns)
  testedProxy: Proxy;

  @Field((type) => GraphQLJSON)
  @Column({ type: "json", nullable: true })
  okResult?: any;

  @Field((type) => GraphQLJSON)
  @Column({ type: "json", nullable: true })
  errorResult?: any;

  @Field()
  @Column({ type: "int" })
  duration_ms: number;
}

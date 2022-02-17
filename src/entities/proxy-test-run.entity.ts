import {
  Column,
  Entity,
  Index,
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
  
  @Index()
  @Field()
  @Column({ type: "datetime" })
  runTime: Date;

  @Field()
  @Column("smallint")
  protocol: 4 | 5;

  @Field((type) => ProxyTestType)
  @ManyToOne(() => ProxyTestType, (testType) => testType.testRuns)
  testType: ProxyTestType;

  @Index('IX_testedProxyId')
  @Field((type) => Proxy)
  @ManyToOne(() => Proxy, (proxy) => proxy.testsRuns)
  testedProxy: Proxy;

  @Field((type) => GraphQLJSON, {nullable: true})
  @Column({ type: "json", nullable: true })
  okResult?: any;

  @Field((type) => GraphQLJSON, {nullable: true})
  @Column({ type: "json", nullable: true })
  errorResult?: any;

  @Field()
  @Column({ type: "int" })
  duration_ms: number;
}

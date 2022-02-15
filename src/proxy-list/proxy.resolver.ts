import {
  Args,
  ArgsType,
  Int,
  Float,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Field,
  registerEnumType,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Paginated } from "../tools.graphql";
import { Repository } from "typeorm";
import { Proxy, ProxySourcesView, ProxyTestRun } from "../entities";

const sleep = (t) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), t));

enum ProxyQuerySortEnum {
  id = "id",
  testsCount = "testsCount",
  successTestCount = "successTestsCount",
  successTestRate = "successTestRate",
}

registerEnumType(ProxyQuerySortEnum, { name: "ProxyQuerySortEnum" });

@ArgsType()
class ProxyQueryArgs {
  @Field((type) => [Int], { nullable: true })
  proxySourcesIds?: number[];

  @Field((type) => [Int], { nullable: true })
  proxyTestTypesIds?: number[];

  @Field((type) => Int, { nullable: true })
  proxyTestsHoursAgo?: number;

  @Field((type) => Boolean, { nullable: true })
  hasNoTests?: boolean;

  @Field((type) => Boolean, { nullable: true })
  hasSuccessTests?: boolean;

  @Field((type) => ProxyQuerySortEnum, { nullable: true })
  sortBy: ProxyQuerySortEnum;

  @Field((type) => Boolean, { nullable: true })
  descending: boolean;
}

@ArgsType()
class ProxiesQueryArgs extends ProxyQueryArgs {
  @Field((type) => Int)
  take: number;
  @Field((type) => Int, { nullable: true })
  skip?: number;
}

@ArgsType()
class PaginatedProxiesQueryArgs extends ProxyQueryArgs {
  @Field((type) => Int)
  page: number;
  @Field((type) => Int)
  rowsPerPage: number;
}

@ObjectType()
class PaginatedProxy extends Paginated<Proxy> {
  @Field((type) => [Proxy])
  rows: Proxy[];
}

@Resolver((of) => Proxy)
export class ProxyResolver {
  constructor(
    @InjectRepository(Proxy) private readonly proxyRepo: Repository<Proxy>,
    @InjectRepository(ProxySourcesView)
    private readonly proxySourcesViewRepo: Repository<ProxySourcesView>,
    @InjectRepository(ProxyTestRun)
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>
  ) {}

  // set @from_t = DATE_SUB(sysdate(), INTERVAL 240 HOUR);
  // SELECT p.*, testsCount, successTestsCount, (successTestsCount/testsCount) AS `rate` FROM `proxy` `p`
  // LEFT JOIN (SELECT testedProxyId, COUNT(*) testsCount, SUM(IF (okResult is not null, 1, 0)) successTestsCount
  //            FROM proxy_test_run
  //            WHERE runTime >= @from_t
  //            GROUP BY testedProxyId) t ON p.id=t.testedProxyId
  // where successTestsCount is not null
  // ORDER BY rate desc
  // LIMIT 10

  private buildQuery(queryArgs: ProxyQueryArgs) {
    let query = this.proxyRepo
      .createQueryBuilder("p")
      .select("p.*")
      .addSelect("(successTestsCount/testsCount)", "successTestRate")
      .addSelect("testsCount, successTestsCount");
    
    const from_date = new Date().setHours(new Date().getHours() - 2);
    console.log(from_date)
    query = query.leftJoin(
      (q) =>
        q
          .select("ptr.testedProxyId")
          .addSelect(
            "COUNT(*) testsCount, SUM(IF (ptr.okResult is not null, 1, 0)) successTestsCount"
          )
          .from(ProxyTestRun, "ptr")
          .where("ptr.runTime >= DATE_SUB(sysdate(), INTERVAL :hours HOUR)", {hours: queryArgs.proxyTestsHoursAgo})
          .groupBy("ptr.testedProxyId"),
      "t",
      "p.id=t.testedProxyId"
    );

    if (typeof queryArgs.hasNoTests === "boolean")
      query = query.andWhere(
        `testsCount is ${queryArgs.hasNoTests ? "" : "not"} null`
      );

    if (queryArgs.hasSuccessTests)
      query = query.andWhere("successTestsCount>0");
    if (queryArgs.sortBy)
      query = query.orderBy(
        queryArgs.sortBy,
        queryArgs.descending ? "DESC" : "ASC"
      );
    return query;
  }

  @Query((returns) => [Proxy])
  async proxies(@Args() queryOptions: ProxiesQueryArgs) {
    const { take, skip } = queryOptions;
    const query = this.buildQuery(queryOptions).offset(skip).limit(take);
    console.log(query.getSql());
    const raw = await query.getRawMany();
    return raw;
  }

  @Query((returns) => PaginatedProxy)
  async proxiesPage(@Args() queryOptions: PaginatedProxiesQueryArgs) {
    const { page, rowsPerPage } = queryOptions;
    const skip = (page - 1) * rowsPerPage;
    const take = rowsPerPage;
    const result = new PaginatedProxy();

    const query = this.buildQuery(queryOptions);

    result.pagination = {
      page,
      rowsPerPage,
      rowsNumber: await query.getCount(),
    };

    result.rows = await query.offset(skip).limit(take).getRawMany();

    return result;
  }

  @Query((returns) => Proxy)
  async proxyById(@Args("proxyId", { type: () => Int }) proxyId: number) {
    return this.proxyRepo.findOne(proxyId);
  }

  @Query((returns) => Int)
  async proxiesCount() {
    return await this.proxyRepo.count();
  }

  @ResolveField((returns) => [ProxySourcesView])
  async sources(@Parent() proxy: Proxy) {
    const proxyId = proxy.id;

    const res = await this.proxySourcesViewRepo.find({
      where: { proxyId },
      relations: ["source", "firstUpdate", "lastUpdate"],
    });

    return res;
  }

  @ResolveField()
  async updates(@Parent() proxy: Proxy) {
    const proxyWithUpdates = await this.proxyRepo.findOne(proxy.id, {
      relations: ["updates"],
    });
    return proxyWithUpdates.updates;
  }

  @ResolveField((returns) => Int, { nullable: true })
  async testsCount(@Parent() proxy: Proxy) {
    return await proxy["testsCount"];
  }

  @ResolveField((returns) => Int, { nullable: true })
  async successTestsCount(@Parent() proxy: Proxy) {
    return await proxy["successTestsCount"];
  }

  @ResolveField((returns) => Float, { nullable: true })
  async successTestRate(@Parent() proxy: Proxy) {
    return await proxy["successTestRate"];
  }

  @ResolveField()
  async testsRuns(@Parent() proxy: Proxy) {
    const proxyWithTestRuns = await this.proxyTestRunRepo.find({
      where: { testedProxy: { id: proxy.id } },
      relations: ["testType"],
    });
    return proxyWithTestRuns;
  }
}

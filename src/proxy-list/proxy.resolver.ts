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
  Mutation,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Paginated } from "../tools.graphql";
import { Repository } from "typeorm";
import {
  Proxy,
  ProxyListUpdate,
  ProxySourcesView,
  ProxyTestRun,
} from "../entities";
import { GraphQLJSON } from "graphql-scalars";

const sleep = (t) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), t));

enum ProxyQuerySortEnum {
  id = "id",
  testsCount = "testsCount",
  successTestCount = "successTestsCount",
  successTestRate = "successTestRate",
  lastSeenOnSourcesHoursAgo = "lastSeenOnSourcesHoursAgo",
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
      .setParameter("now", new Date())
      .select("p.*");

    query = query
      .leftJoin(
        (q) => {
          let res = q
            .select("testedProxyId")
            .addSelect(
              "COUNT(*) testsCount, SUM(IF (okResult is not null, 1, 0)) successTestsCount"
            )
            .disableEscaping()
            .from(ProxyTestRun, "ignore index(IX_testedProxyId)");
          if (queryArgs.proxyTestsHoursAgo) {
            res = res.where("runTime >= DATE_SUB(:now, INTERVAL :hours HOUR)", {
              hours: queryArgs.proxyTestsHoursAgo,
            });
          }
          res = res.groupBy("testedProxyId");
          return res;
        },
        "t",
        "p.id=t.testedProxyId"
      )
      .addSelect("(successTestsCount/testsCount)", "successTestRate")
      .addSelect("testsCount, successTestsCount");

    query = query
      .leftJoin(
        (q) =>
          q
            .select(
              "t.proxyId, HOUR(TIMEDIFF(:now, t.lastSeen)) lastSeenOnSourcesHoursAgo"
            )
            .from(
              (q) =>
                q
                  .select("psv.proxyId, MAX(plu.updateTime) lastSeen")
                  .from(ProxySourcesView, "psv")
                  .leftJoin(ProxyListUpdate, "plu", "psv.lastUpdateId=plu.id")
                  .groupBy("psv.proxyId"),
              "t"
            ),
        "ls",
        "p.id = ls.proxyId"
      )
      .addSelect("lastSeenOnSourcesHoursAgo");

    if (typeof queryArgs.hasNoTests === "boolean")
      query = query.andWhere(
        `testsCount is ${queryArgs.hasNoTests ? "" : "not"} null`
      );

    if (typeof queryArgs.hasSuccessTests === "boolean")
      query = query.andWhere(
        `successTestsCount${queryArgs.hasSuccessTests ? ">" : "="}0`
      );

    if (queryArgs.sortBy){
      query = query.orderBy(
        queryArgs.sortBy,
        queryArgs.descending ? "DESC" : "ASC"
      );
    if (queryArgs.sortBy !== ProxyQuerySortEnum.id) {
      query = query.addOrderBy("id", queryArgs.descending ? "DESC" : "ASC");
    }
  }
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

  @Mutation((returns) => GraphQLJSON)
  async deleteProxy(@Args("id", { type: () => Int }) id: number) {
    const deletedProxy = await this.proxyRepo.findOne(id);
    if (deletedProxy) {
      const proxyTestRunDeletionResult = await this.proxyTestRunRepo.delete({testedProxy:deletedProxy})
      deletedProxy.testsRuns = [];
      deletedProxy.updates = [];
      await this.proxyRepo.save(deletedProxy);
      const proxyResult = await this.proxyRepo.remove(deletedProxy);
      return {proxy: deletedProxy, proxyTestRunDeletionResult};
    } else {
      throw new Error(`Proxy id:${id} not found.`);
    }
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

  @ResolveField((returns) => Float, { nullable: true })
  lastSeenOnSourcesHoursAgo(@Parent() proxy: Proxy) {
    return proxy["lastSeenOnSourcesHoursAgo"];
  }

  @ResolveField()
  async updates(@Parent() proxy: Proxy) {
    const proxyWithUpdates = await this.proxyRepo.findOne(proxy.id, {
      relations: ["updates"],
    });
    return proxyWithUpdates.updates;
  }

  @ResolveField((returns) => Int, { nullable: true })
  testsCount(@Parent() proxy: Proxy) {
    return proxy["testsCount"];
  }

  @ResolveField((returns) => Int, { nullable: true })
  successTestsCount(@Parent() proxy: Proxy) {
    return proxy["successTestsCount"];
  }

  @ResolveField((returns) => Float, { nullable: true })
  successTestRate(@Parent() proxy: Proxy) {
    return proxy["successTestRate"];
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

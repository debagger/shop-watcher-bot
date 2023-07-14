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
  Context,
} from "@nestjs/graphql";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Paginated } from "../tools.graphql";
import { DataSource, FindOptionsWhere, In, Repository, SelectQueryBuilder } from "typeorm";
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
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>,
    @InjectRepository(ProxyListUpdate)
    private readonly proxyListUpdateRepo: Repository<ProxyListUpdate>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) { }

  private buildTestCountsSubQuery(queryArgs: ProxyQueryArgs) {
    return (q: SelectQueryBuilder<any>) => {
      q = q
        .select("testedProxyId").from(ProxyTestRun, 'ptr')
        .addSelect("COUNT(*)", "testsCount")
        .addSelect("SUM(ptr.isOk)", "successTestsCount")
        .groupBy("testedProxyId");

      if (queryArgs.proxyTestsHoursAgo) {
        q = q.where("runTime >= DATE_SUB(:now, INTERVAL :hours HOUR)", {
          hours: queryArgs.proxyTestsHoursAgo,
        });
      }
      return q
    }
  }

  private buildLastSourcesSubQuery() {
    return (q: SelectQueryBuilder<any>) =>
      q.select("proxyId")
        .from(
          (q) =>
            q.select("proxyId")
              .from(ProxySourcesView, "psv")
              .leftJoin(ProxyListUpdate, "plu", "psv.lastUpdateId=plu.id")
              .addSelect("MAX(plu.updateTime)", "lastSeen")
              .groupBy("psv.proxyId"),
          "t"
      )
        .addSelect("TIMESTAMPDIFF(HOUR, t.lastSeen, :now)", "lastSeenOnSourcesHoursAgo")
  }

  private buildQuery(queryArgs: ProxyQueryArgs) {
    let query = this.proxyRepo
      .createQueryBuilder("p")
      .setParameter("now", new Date())
      .leftJoin(this.buildTestCountsSubQuery(queryArgs), "t", "p.id=t.testedProxyId")
      .addSelect("(successTestsCount/testsCount)", "successTestRate")
      .addSelect("testsCount")
      .addSelect("successTestsCount")
    // .leftJoin(this.buildLastSourcesSubQuery(), "ls", "p.id = ls.proxyId")
    // .addSelect("lastSeenOnSourcesHoursAgo");

    if (typeof queryArgs.hasNoTests === "boolean")
      query = query.andWhere(
        `testsCount is ${queryArgs.hasNoTests ? "" : "not"} null`
      );

    if (typeof queryArgs.hasSuccessTests === "boolean")
      query = query.andWhere(
        `successTestsCount${queryArgs.hasSuccessTests ? ">" : "="}0`
      );

    if (queryArgs.sortBy) {
      query = query.orderBy(
        queryArgs.sortBy === 'lastSeenOnSourcesHoursAgo' ? 'p_lastSeenOnSourcesHoursAgo' : queryArgs.sortBy,
        queryArgs.descending ? "DESC" : "ASC"
      );
      if (queryArgs.sortBy !== ProxyQuerySortEnum.id) {
        query = query.addOrderBy("p.id", queryArgs.descending ? "DESC" : "ASC");
      }
    }
    return query.select();
  }

  @Query((returns) => [Proxy])
  async proxies(@Args() queryOptions: ProxiesQueryArgs) {
    const { take, skip } = queryOptions;
    const query = this.buildQuery(queryOptions).offset(skip).limit(take);
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

    const proxyList = await query.clone().offset(skip).limit(take).getRawMany()

    const pageQuery = this.proxyRepo.createQueryBuilder("p")
      .select('p.id')
      .addSelect('p.host')
      .addSelect('p.port')
      .where(`p.id IN (${proxyList.map(i => i.p_id).join(",")})`)
      .leftJoinAndSelect('p.sources', 'psv')
      .leftJoinAndSelect("psv.source", 'psv_src')
      .leftJoinAndSelect("psv.firstUpdate", 'psv_fu')
      .leftJoinAndSelect("psv.lastUpdate", 'psv_lu')


    const queryResult = await pageQuery.getMany();

    const detailedProxysMap = new Map(queryResult.map(proxy => [proxy.id, proxy]))

    result.rows = proxyList.map(i => ({
      ...i,
      ...detailedProxysMap.get(i.p_id)
    }))
    return result;
  }

  @Query((returns) => Proxy)
  async proxyById(@Args("proxyId", { type: () => Int }) proxyId: number) {
    return this.proxyRepo.findOne({ where: { id: proxyId } });
  }

  @Query((returns) => Int)
  async proxiesCount() {
    return await this.proxyRepo.count();
  }

  @Mutation((returns) => GraphQLJSON)
  async deleteProxy(@Args("id", { type: () => Int }) id: number) {
    const deletedProxy = await this.proxyRepo.delete({ id })
    return { proxy: deletedProxy };
  }

  @ResolveField((returns) => [ProxySourcesView])
  async sources(@Parent() proxy: Proxy) {
    const res = proxy.sources
    return res;
  }

  @ResolveField()
  async updates(@Parent() { id }: Proxy) {
    const proxyWithUpdates = await this.proxyRepo.findOne({
      where: { id },
      relations: ["updates"],
    });
    return proxyWithUpdates.updates;
  }

  @ResolveField((returns) => Float, { nullable: true })
  lastSeenOnSourcesHoursAgo(@Parent() proxy: Proxy) {
    return proxy["p_lastSeenOnSourcesHoursAgo"];
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

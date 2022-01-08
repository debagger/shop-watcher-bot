import {
  Args,
  Int,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Field,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Paginated } from "../tools.graphql";
import { Repository } from "typeorm";
import {
  Proxy,
  ProxySourcesView,
} from "../entities";

const sleep = (t) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), t));

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
    private readonly proxySourcesViewRepo: Repository<ProxySourcesView>
  ) {}

  @Query((returns) => [Proxy])
  async proxies(
    @Args("take", { type: () => Int }) take: number,
    @Args("skip", { type: () => Int }) skip: number
  ) {
    // await sleep(1000);
    return await this.proxyRepo.find({ take, skip, order: { id: "ASC" } });
  }

  @Query((returns) => PaginatedProxy)
  async proxiesPage(
    @Args("page", { type: () => Int }) page: number,
    @Args("rowsPerPage", { type: () => Int }) rowsPerPage: number
  ) {
    const skip = (page - 1) * rowsPerPage;
    const take = rowsPerPage;
    const result = new PaginatedProxy();

    result.pagination = {
      page,
      rowsPerPage,
      rowsNumber: await this.proxiesCount(),
    };

    result.rows = await this.proxies(take, skip);

    return result;
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

  @ResolveField()
  async testsRuns(@Parent() proxy: Proxy) {
    const proxyWithTestRuns = await this.proxyRepo.findOne(proxy.id, {
      relations: ["testsRuns"],
    });
    return proxyWithTestRuns.testsRuns;
  }
}

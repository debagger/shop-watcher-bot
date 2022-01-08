import {
  Args,
  Int,
  Query,
  Resolver,
  ResolveField,
  Parent,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProxyListSource, ProxyListUpdate } from "../entities";

@Resolver((of) => ProxyListSource)
export class ProxyListSourceResolver {
  constructor(
    @InjectRepository(ProxyListSource)
    private readonly proxyListSourceRepo: Repository<ProxyListSource>,
    @InjectRepository(ProxyListUpdate)
    private readonly proxyListUpdateRepo: Repository<ProxyListUpdate>
  ) {}
  @Query((returns) => [ProxyListSource])
  async proxyListSources(
    @Args("take", { type: () => Int }) take: number,
    @Args("skip", { type: () => Int }) skip: number
  ) {
    return await this.proxyListSourceRepo.find({
      take,
      skip,
      order: { id: "ASC" },
    });
  }

  @ResolveField((type) => [ProxyListUpdate])
  async updates(@Parent() proxyListSource: ProxyListSource) {
    const proxyListSourceWithUpdates = await this.proxyListSourceRepo.findOne(
      proxyListSource.id,
      { relations: ["updates"] }
    );
    return proxyListSourceWithUpdates.updates;
  }

  @ResolveField((type) => ProxyListUpdate)
  async lastUpdate(@Parent() proxyListSource: ProxyListSource) {
    const proxyListSourceLastUpdate = await this.proxyListUpdateRepo.findOne({
      where: { source: { id: proxyListSource.id } },
      order: { updateTime: "DESC" },
    });
    return proxyListSourceLastUpdate;
  }
}

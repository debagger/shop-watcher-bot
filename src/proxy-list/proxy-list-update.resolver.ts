import {
  Resolver,
  Query,
  Args,
  Int,
  ResolveField,
  Parent,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProxyListUpdate, Proxy, ProxyListSource } from "../entities";

@Resolver((type) => ProxyListUpdate)
export class ProxyListUpdateResolver {
  constructor(
    @InjectRepository(ProxyListUpdate)
    private readonly proxyListUpdateRepo: Repository<ProxyListUpdate>,
    @InjectRepository(Proxy)
    private readonly proxyRepo: Repository<Proxy>
  ) {}
  @Query((returns) => [ProxyListUpdate])
  async proxyListUpdates(
    @Args("take", { type: () => Int }) take: number,
    @Args("skip", { type: () => Int }) skip: number
  ) {
    return await this.proxyListUpdateRepo.find({ take, skip });
  }

  @ResolveField((returns) => [ProxyListSource])
  async source(@Parent() { id }: ProxyListUpdate) {
    const result = await this.proxyListUpdateRepo.findOne({
      where: { id },
      relations: ['source']
    })
    return result.source
  }

  @ResolveField((returns) => [Proxy])
  async loadedProxies(@Parent() { id }: ProxyListUpdate) {
    const proxyListUpdateWithLoadedProxies =
      await this.proxyListUpdateRepo.findOne({
        where: { id },
        relations: ["loadedProxies"],
      });
    return proxyListUpdateWithLoadedProxies.loadedProxies;
  }

  
  private updateNewProxiesQuery(proxyListUpdate: ProxyListUpdate) {
    return this.proxyRepo
      .createQueryBuilder("p")
      .innerJoin(
        (qb) => qb
          .from(Proxy, "p")
          .innerJoin("p.updates", "plu")
          .groupBy("p.id")
          .select("p.id as proxyId, MIN(plu.id) as firstUpdateId"),
        "fu",
        "id=fu.proxyId"
      )
      .where("fu.firstUpdateId=:updateId", { updateId: proxyListUpdate.id });
  }

  @ResolveField((returns) => [Proxy])
  async newProxies(@Parent() proxyListUpdate: ProxyListUpdate) {
    const resultQuery = this.updateNewProxiesQuery(proxyListUpdate);
    const result = await resultQuery.getMany();
    return result;
  }

  @ResolveField((returns) => Int)
  async newProxiesCount(@Parent() proxyListUpdate: ProxyListUpdate) {
    const resultQuery = this.updateNewProxiesQuery(proxyListUpdate);
    const result = await resultQuery.getCount();
    return result;
  }
}

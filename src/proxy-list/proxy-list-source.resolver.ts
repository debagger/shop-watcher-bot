import {
  Args,
  Int,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Mutation,
  Subscription,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { GraphQLJSON } from "graphql-scalars";
import { Repository } from "typeorm";
import { ProxyListSource, ProxyListUpdate } from "../entities";
import { ProxyListUpdaterService } from "./proxy-list-updater.service";

@Resolver((of) => ProxyListSource)
export class ProxyListSourceResolver {
  constructor(
    @InjectRepository(ProxyListSource)
    private readonly proxyListSourceRepo: Repository<ProxyListSource>,
    @InjectRepository(ProxyListUpdate)
    private readonly proxyListUpdateRepo: Repository<ProxyListUpdate>,
    private readonly proxyListUpdater: ProxyListUpdaterService
  ) {}
  @Query((returns) => [ProxyListSource])
  async proxyListSources() {
    return await this.proxyListSourceRepo.find({
      order: { name: "ASC" },
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

  @Mutation(returns=>GraphQLJSON)
  async runSourceUpdate(@Args({name:'sourceId', type:()=>Int}) sourceId:number){
    try {
      await this.proxyListUpdater.updateSource(sourceId)
      return {OK:true}  
    } catch (error) {
      return {error}
    }
  }
}

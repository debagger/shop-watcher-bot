import { Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { SiteCrawlerState } from "./site-crawler-state.model";
import { SiteCrawlerService } from "./site-crawler.service";

@Resolver(of => SiteCrawlerState)
export class SiteCrawlerResolver {
    constructor(
        private readonly siteCrawlerService: SiteCrawlerService,
    ) { }

    @Query(returns => SiteCrawlerState)
    async state() {
        return {
            pendingRequests: this.siteCrawlerService.getPendingRequests()
        }
    }

    @ResolveField(type=>[String])
    async pendingRequests(@Parent() state: SiteCrawlerState) {
        return this.siteCrawlerService.getPendingRequests()
    }
}
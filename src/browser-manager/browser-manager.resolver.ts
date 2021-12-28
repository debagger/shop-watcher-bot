import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BestProxyItemModel, BrowserManagerModel, KnownHostModel } from './browser-manager.model';
import { BrowserManagerService } from './browser-manager.service';

@Resolver(of => BrowserManagerModel)
export class BrowserManagerResolver {
    constructor(private browserManagerService: BrowserManagerService) { }

    @Query(returns => BrowserManagerModel)
    browserManagerState(): BrowserManagerModel {
        return new BrowserManagerModel()
    }

    @ResolveField('knownHosts', returns => [KnownHostModel])
    knownHosts(@Parent() browserManager: BrowserManagerModel) {
        const hosts = Object.keys(this.browserManagerService.bestProxies)
        return hosts.map(host => {
            const newHost = new KnownHostModel()
            newHost.hostName = host
            return newHost
        })
    }




}

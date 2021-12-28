import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BestProxyItemModel, KnownHostModel } from './browser-manager.model';
import { BrowserManagerService } from './browser-manager.service';

@Resolver(type => KnownHostModel)
export class KnownHostsResolver {

    constructor(private readonly browserManagerService: BrowserManagerService) { }

    @ResolveField('proxiesBlackList', returns => [String])
    proxiesBlackList(@Parent() knownHost: KnownHostModel) {
        const hostData = this.browserManagerService.bestProxies[knownHost.hostName]
        const result: string[] = []
        hostData.blacklist.forEach(blItem => {
            result.push(blItem)
        })
        return result
    }

    @ResolveField('proxiesBestList', returns => [BestProxyItemModel])
    proxiesBestList(@Parent() knownHost: KnownHostModel) {
        const hostData = this.browserManagerService.bestProxies[knownHost.hostName];
        const aggreated = hostData.best.reduce((acc, item) => {
            acc[item] ? acc[item]++ : acc[item] = 1
            return acc
        }, {})
        const result = Object.keys(aggreated).map(proxyAddr => {
            const item = new BestProxyItemModel()
            item.rating = aggreated[proxyAddr]
            item.proxyAddress = proxyAddr
            return item
        })
        return result
    }

}

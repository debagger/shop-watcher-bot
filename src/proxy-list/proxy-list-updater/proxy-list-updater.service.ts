import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ProxyListSourcesService } from '../proxy-list-sources/proxy-list-sources.service';
import { ProxyListSource, ProxyListUpdate, Proxy } from "./../../entities";
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ProxyListUpdaterService {
    constructor(private sourcesService: ProxyListSourcesService,
        @InjectRepository(ProxyListSource) private proxyListSourceRepo: Repository<ProxyListSource>,
        @InjectRepository(ProxyListUpdate) private proxyListUpdatesRepo: Repository<ProxyListUpdate>,
        @InjectRepository(Proxy) private proxiesRepo: Repository<Proxy>,
        private logger: PinoLogger) { }

    @Cron("0 * * * * *")
    async updateAllSources() {
        const knownSourcesNames = this.sourcesService.getSourcesNames()
        for (const sourceName of knownSourcesNames) {
            let sourceItem = await this.proxyListSourceRepo.findOne({ name: sourceName })
            let isTimeToUpdate = false;
            if (!sourceItem) {
                isTimeToUpdate = true
                sourceItem = await this.proxyListSourceRepo.save({ name: sourceName })
            }
            const updatesCount = await this.proxyListUpdatesRepo.count({ where: { source: { id: sourceItem.id } } })
            if (updatesCount > 0) {
                const lastUpdateTime = (await this.proxyListUpdatesRepo.find({ select: ['updateTime'], order: { updateTime: 'DESC' }, take: 1 }))[0].updateTime
                const nowTime = new Date().getTime()
                const secondsFromLastUpdate = (nowTime - lastUpdateTime.getTime()) / 1000
                if (secondsFromLastUpdate > sourceItem.updateInterval) isTimeToUpdate = true
            }
            else {
                isTimeToUpdate = true
            }


            if (isTimeToUpdate) {
                try {
                    this.logger.info(`Begin update from proxy list source. Source name: "${sourceItem.name}"  `)
                    await this.updateSource(sourceItem.id)
                } catch (error) {
                    this.logger.error(error, `Proxy list web source update error. Source name: ${sourceItem.name}`)
                }
            }

        }

    }

    async updateSource(id: number) {
        const sourceItem = await this.proxyListSourceRepo.findOneOrFail(id)
        if (!this.sourcesService.getSourcesNames().includes(sourceItem.name)) {
            throw new Error(`Proxy list source '${sourceItem.name}' is unknown and cant be updated.`)
        }

        const newProxyListUpdate = this.proxyListUpdatesRepo.create({ source: sourceItem, updateTime: new Date() })
        try {
            const proxiesList = await this.sourcesService.extractSourceData(sourceItem.name)

            const updatedProxyList = <Proxy[]>[]

            for (const proxiesListItem of proxiesList) {
                if (updatedProxyList.find(proxy => proxy.host === proxiesListItem.host && proxy.port === proxiesListItem.port)) continue
                let dbProxyItem = await this.proxiesRepo.findOne({ where: { ...proxiesListItem } })
                if (!dbProxyItem) {
                    dbProxyItem = this.proxiesRepo.create({ ...proxiesListItem })
                    await this.proxiesRepo.save(dbProxyItem);
                }
                updatedProxyList.push(dbProxyItem);
            }
            newProxyListUpdate.loadedProxies = updatedProxyList
        } catch (error) {
            newProxyListUpdate.error = error
            this.logger.error(error, `Proxy list web source update error. Source name: ${sourceItem.name}`)
        }
        await this.proxyListUpdatesRepo.save(newProxyListUpdate)
    }


}

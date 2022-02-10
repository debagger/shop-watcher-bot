import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cron } from "@nestjs/schedule";
import { ProxyListSourcesService } from "./proxy-list-sources.service";
import { ProxyListSource, ProxyListUpdate, Proxy } from "../entities";
import { PinoLogger } from "nestjs-pino";
import { ApplicationError } from "src/AppError.class";

@Injectable()
export class ProxyListUpdaterService {
  constructor(
    private sourcesService: ProxyListSourcesService,
    @InjectRepository(ProxyListSource)
    private proxyListSourceRepo: Repository<ProxyListSource>,
    @InjectRepository(ProxyListUpdate)
    private proxyListUpdatesRepo: Repository<ProxyListUpdate>,
    @InjectRepository(Proxy) private proxiesRepo: Repository<Proxy>,
    private logger: PinoLogger
  ) {}

  @Cron("0 * * * * *")
  async updateAllSources() {
    const knownSourcesNames = this.sourcesService.getSourcesNames();
    for (const sourceName of knownSourcesNames) {
      let sourceItem = await this.proxyListSourceRepo.findOne({
        name: sourceName,
      });
      let isTimeToUpdate = false;
      if (!sourceItem) {
        isTimeToUpdate = true;
        sourceItem = await this.proxyListSourceRepo.save({ name: sourceName });
      }
      const updatesCount = await this.proxyListUpdatesRepo.count({
        where: { source: { id: sourceItem.id } },
      });
      if (updatesCount > 0) {
        const lastUpdateTime = (
          await this.proxyListUpdatesRepo.find({
            select: ["updateTime"],
            where: { source: { id: sourceItem.id } },
            order: { updateTime: "DESC" },
            take: 1,
          })
        )[0].updateTime;
        const nowTime = new Date().getTime();
        const secondsFromLastUpdate =
          (nowTime - lastUpdateTime.getTime()) / 1000;
        if (secondsFromLastUpdate > sourceItem.updateInterval)
          isTimeToUpdate = true;
      } else {
        isTimeToUpdate = true;
      }

      if (isTimeToUpdate && !this.isUpddateInProgress.has(sourceItem.id)) {
        try {
          this.logger.info(
            `Begin update from proxy list source. Source name: '${sourceItem.name}'  `
          );
          this.isUpddateInProgress.add(sourceItem.id);
          await this.updateSource(sourceItem.id).finally(()=>this.isUpddateInProgress.delete(sourceItem.id));
        } catch (error) {
          this.logger.error(
            error,
            `Proxy list web source update error. Source name: ${sourceItem.name}`
          );
        }
      }
    }
  }

  private isUpddateInProgress = new Set<number>()

  async updateSource(id: number) {
    const sourceItem = await this.proxyListSourceRepo.findOneOrFail(id);
    if (!this.sourcesService.getSourcesNames().includes(sourceItem.name)) {
      throw new Error(
        `Proxy list source '${sourceItem.name}' is unknown and cant be updated.`
      );
    }

    const newProxyListUpdate = this.proxyListUpdatesRepo.create({
      source: sourceItem,
      updateTime: new Date(),
    });

    let totalProxiesCount = 0;
    let newProxiesCount = 0;

    try {
      const proxiesList = await this.sourcesService.extractSourceData(
        sourceItem.name
      );

      const updatedProxyList = <Proxy[]>[];

      for (const proxiesListItem of proxiesList) {
        const isDublicated = updatedProxyList.find(
          (proxy) =>
            proxy.host === proxiesListItem.host &&
            proxy.port === proxiesListItem.port
        );
        if (isDublicated) continue;

        totalProxiesCount++;

        let dbProxyItem = await this.proxiesRepo.findOne({
          where: { ...proxiesListItem },
        });
        if (!dbProxyItem) {
          newProxiesCount++;

          dbProxyItem = this.proxiesRepo.create({ ...proxiesListItem });
          await this.proxiesRepo.save(dbProxyItem);
        }
        updatedProxyList.push(dbProxyItem);
      }
      newProxyListUpdate.loadedProxies = updatedProxyList;
    } catch (error) {
      const msg = `Proxy list web source '${sourceItem.name}' update error. \n Error message: ${error.message}`;
      newProxyListUpdate.error = new ApplicationError({
        name: error.name,
        message: msg,
        stack: error.stack,
      });
      this.logger.error(error, msg);
    }

    await this.proxyListUpdatesRepo.save(newProxyListUpdate);

    if (newProxyListUpdate.error) throw newProxyListUpdate.error;
    this.logger.info(
      `Proxy list source ${sourceItem.name} updated. Found ${totalProxiesCount} total, ${newProxiesCount} new proxies.`
    );
  }
}

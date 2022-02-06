import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { response } from "express";
import { PinoLogger } from "nestjs-pino";
import { parse } from "node-html-parser";
import { connect, HTTPResponse } from "puppeteer";
import { ApplicationError } from "src/AppError.class";
import { BrowseContext } from "src/browser-manager/browse-context.type";
import { BrowserManagerService } from "src/browser-manager/browser-manager.service";
import { IsNull, Not, Repository } from "typeorm";
import { ProxyTestRun } from "../entities";
import { FreeProxyCzSourceService } from "./sources/free-proxy-cz.service";
import { HidemyNameSourceService } from "./sources/hidemy-name.service";
import { SocksProxyNetSourceService } from "./sources/socks-proxy-net.service";
import { SpysOneSourceService } from "./sources/spys-one.service";
import { parseIPPortString, ProxyListExtractor } from "./sources/tools";



@Injectable()
export class ProxyListSourcesService {
  constructor(
    private readonly logger: PinoLogger,
    private browserManager: BrowserManagerService,
    @InjectRepository(ProxyTestRun)
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>,
    private readonly socksProxyNetSource: SocksProxyNetSourceService,
    private readonly hidemyNameSource: HidemyNameSourceService,
    private readonly spysOneSource: SpysOneSourceService,
    private readonly freeProxyCzSource: FreeProxyCzSourceService
  ) {}

  private sources: Record<string, ProxyListExtractor> = {
    "www.socks-proxy.net": ()=>this.socksProxyNetSource.extract(),
    "hidemy.name": ()=> this.hidemyNameSource.extract(),
    "spys.one": ()=> this.spysOneSource.extract(),
    "free-proxy.cz": ()=>this.freeProxyCzSource.extract(),
  };

  public getSourcesNames() {
    return Object.keys(this.sources);
  }

  public async extractAllSources() {
    this.logger.info(`Run proxy list extraction from web sources...`);
    const extractionResult = await Promise.all(
      Object.entries(this.sources).map(async ([sourceName, source]) => {
        const result = { sourceName, list: null, error: null };
        try {
          result.list = await source();
        } catch (error) {
          result.error = error;
        }
        return result;
      })
    );

    this.logger.info(`Proxy list extraction from web sources completed.`);
    return extractionResult.reduce(
      (acc, sourceResult) => {
        if (sourceResult.list) acc.list.push(...sourceResult.list);
        if (sourceResult.error)
          acc.errors[sourceResult.sourceName] = sourceResult.error;
        return acc;
      },
      { list: <string[]>[], errors: {} }
    );
  }

  public async extractSourceData(sourceName: string) {
    try {
      const extractionResult = await this.sources[sourceName]();
      return extractionResult.map((item) => parseIPPortString(item));
    } catch (error) {
      throw new Error(`Proxy source '${sourceName}' extraction error. Message: ${error.message}`);
      
    }
  }
}

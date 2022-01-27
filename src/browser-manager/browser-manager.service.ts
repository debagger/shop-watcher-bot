import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios, { AxiosRequestConfig, AxiosResponse, Method } from "axios";
import { PinoLogger } from "nestjs-pino";
import { connect, Page, HTTPRequest } from "puppeteer";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ProxyTestRun, ProxyListUpdate, Proxy } from "./../entities";
import { Repository } from "typeorm";
import {
  ActiveProxyRequestContext,
  BrowseContext,
} from "./browse-context.type";
import { performance } from "perf_hooks";

@Injectable()
export class BrowserManagerService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Proxy) private readonly proxyRepo: Repository<Proxy>,
    @InjectRepository(ProxyTestRun)
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>,
    @InjectRepository(ProxyListUpdate)
    private readonly proxyListUpdatesRepo: Repository<ProxyListUpdate>
  ) {
    logger.setContext(BrowserManagerService.name);
  }

  public readonly bestProxies: Record<
    string,
    { best: string[]; blacklist: Set<string> }
  > = {};

  private async getProxiedResponse(
    axiosRequestConfig: AxiosRequestConfig,
    browseContext: BrowseContext
  ): Promise<{ proxyAddress: string; response: AxiosResponse; time: number }> {
    const url = new URL(axiosRequestConfig.url);
    const host = url.host;

    const getRandomsFromArray = <T>(arr: T[], count: number) => {
      const res: T[] = [];
      for (let index = 0; index < count; index++) {
        const random_idx = Math.floor(Math.random() * (arr.length - 1));
        res.push(arr[random_idx]);
      }
      return res;
    };

    if (!this.bestProxies[host]) {
      this.bestProxies[host] = {
        best: [],
        blacklist: new Set(),
      };
    }

    const proxies = await this.proxyRepo.find({
      order: { id: "DESC" },
      take: 500,
    });

    const proxyAdressess = Array.from(
      new Set(
        proxies
          .map((p) => `socks4://${p.host}:${p.port}`)
          .filter((i) => !this.bestProxies[host].blacklist.has(i))
      )
    );

    const proxiesUsePerRequest = 30;
    const bestProxiesSet = Array.from(new Set(this.bestProxies[host].best));
    const predefinedProxiesSet: string[] = [];
    if (browseContext.predefinedProxiesAddresses) {
      const maxProxiesCount = proxiesUsePerRequest - bestProxiesSet.length;
      if (maxProxiesCount >= browseContext.predefinedProxiesAddresses.length) {
        predefinedProxiesSet.push(...browseContext.predefinedProxiesAddresses);
      } else {
        predefinedProxiesSet.push(
          ...getRandomsFromArray(
            browseContext.predefinedProxiesAddresses,
            maxProxiesCount
          )
        );
      }
    }

    const additionalProxies = getRandomsFromArray(
      proxyAdressess,
      proxiesUsePerRequest -
        (bestProxiesSet.length + predefinedProxiesSet.length)
    );
    const proxiesForRequest = [
      ...bestProxiesSet,
      ...predefinedProxiesSet,
      ...additionalProxies,
    ];

    const agents = proxiesForRequest.map((proxyAddress) => {
      const agent = new SocksProxyAgent(proxyAddress);
      return { proxyAddress, agent };
    });

    const CancelToken = axios.CancelToken;
    const sources = [];

    try {
      const result = await Promise.any(
        agents.map(async ({ proxyAddress, agent }) => {
          if (this.bestProxies[host].blacklist.has(proxyAddress)) {
            throw new Error(
              `Proxy ${proxyAddress} in blacklist for ${host} host`
            );
          }

          const cancelSource = CancelToken.source();
          const requestContext: ActiveProxyRequestContext = {
            axiosRequestConfig: {
              ...axiosRequestConfig,
              httpAgent: agent,
              httpsAgent: agent,
              timeout: 10000,
              cancelToken: cancelSource.token,              
            },
            canceTokenSource: cancelSource,
            proxyUrl: proxyAddress,
            url: axiosRequestConfig.url,
          };
          browseContext.activeRequests.add(requestContext);

          sources.push(cancelSource);
          const start = performance.now();
          const response = await axios(
            requestContext.axiosRequestConfig
          ).finally(() => {
            browseContext.activeRequests.delete(requestContext);
          });

          if (browseContext.isValidResponse(response)) {
            sources.forEach(({ cancel }) => cancel());

            this.bestProxies[host].best.push(proxyAddress);

            while (this.bestProxies[host].best.length > 30) {
              this.bestProxies[host].best.shift();
            }

            return { proxyAddress, response, time: performance.now() - start };
          } else {
            console.log(`Proxy ${proxyAddress} blacklisted for ${host} host`);
            this.bestProxies[host].best = this.bestProxies[host].best.filter(
              (i) => i !== proxyAddress
            );
            this.bestProxies[host].blacklist.add(proxyAddress);
            throw new Error(
              `Validation fails for ${proxyAddress}  ${axiosRequestConfig.url}`
            );
          }
        })
      );

      return result;
    } catch (error) {
      throw new Error("All requests fails!");
    }
  }

  private async browserRequestInteceptor(
    interceptedRequest: HTTPRequest,
    context: BrowseContext,
    page: Page
  ) {
    if (interceptedRequest.url().startsWith("data:")) {
      return await interceptedRequest.continue();
    }
    try {
      const config: AxiosRequestConfig = {
        url: interceptedRequest.url(),
        method: <Method>interceptedRequest.method(),
        data: interceptedRequest.postData(),
        headers: interceptedRequest.headers(),
        responseType: "arraybuffer",
      };

      const {
        response: res,
        proxyAddress,
        time,
      } = await this.getProxiedResponse(config, context);
      await interceptedRequest.respond({
        body: res.data,
        headers: res.headers,
        status: res.status,
        contentType: res.headers["content-type"],
      });

      console.log(
        `(${Math.floor(
          time
        )}ms) From ${proxyAddress} get ${interceptedRequest.url()}`
      );
    } catch (error) {
      console.error(error.message + " " + interceptedRequest.url());
      await interceptedRequest
        .respond({
          body: "Proxy error",
          headers: { "content-type": "text/plain charset=utf-8" },
          status: 500,
          contentType: "text/plain charset=utf-8",
        })
        .catch((err) => console.error(err));
    }
  }

  public async browse<T>(
    context: BrowseContext,
    action: (page: Page) => Promise<T>
  ): Promise<T> {
    const browser = await connect({
      browserWSEndpoint: "ws://chromium:3000?timeout=300000",
      defaultViewport: { height: 1080, width: 1920 },
    });

    const page = await (context.incognito
      ? (await browser.createIncognitoBrowserContext()).newPage()
      : browser.newPage());

    page.once("close", () => {
      console.log(
        `Cancel ${context.activeRequests.size} active requests due to page close`
      );
      context.activeRequests.forEach((requestContext) =>
        requestContext.canceTokenSource.cancel()
      );
    });

    await page.setRequestInterception(true);

    page.on("request", (request) =>
      this.browserRequestInteceptor(request, context, page)
    );

    const result = await action(page);
    await page.close();
    browser.disconnect();
    return result;
  }
}

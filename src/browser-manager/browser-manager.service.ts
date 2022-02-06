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
  BrowseArgs,
  BrowseContext,
} from "./browse-context.type";
import { performance } from "perf_hooks";
import { getRandomsFromArray } from "./tools";

@Injectable()
export class BrowserManagerService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Proxy) private readonly proxyRepo: Repository<Proxy>
  ) {
    logger.setContext(BrowserManagerService.name);
  }

  public readonly bestProxies: Record<
    string,
    { best: string[]; blacklist: Set<string> }
  > = {};

  private blacklistProxyForHost(proxyAddress: string, host: string) {
    console.log(`Proxy ${proxyAddress} blacklisted for ${host} host`);
    this.bestProxies[host].best = this.bestProxies[host].best.filter(
      (i) => i !== proxyAddress
    );
    this.bestProxies[host].blacklist.add(proxyAddress);
  }

  private setBestProxy(host: string, proxyAddress: string) {
    this.bestProxies[host].best.push(proxyAddress);
    while (this.bestProxies[host].best.length > 30) {
      this.bestProxies[host].best.shift();
    }
  }

  private async prepereProxiesListForRequest(
    host: string,
    predefinedProxiesAddresses: string[],
    proxiesUsePerRequest: number
  ) {
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

    const bestProxiesSet = Array.from(new Set(this.bestProxies[host].best));
    const predefinedProxiesSet: string[] = [];
    if (predefinedProxiesAddresses) {
      const maxProxiesCount = proxiesUsePerRequest - bestProxiesSet.length;
      if (maxProxiesCount >= predefinedProxiesAddresses.length) {
        predefinedProxiesSet.push(...predefinedProxiesAddresses);
      } else {
        predefinedProxiesSet.push(
          ...getRandomsFromArray(predefinedProxiesAddresses, maxProxiesCount)
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
    return proxiesForRequest;
  }

  private async getProxiedResponse(
    axiosRequestConfig: AxiosRequestConfig,
    browseContext: BrowseContext
  ): Promise<{ proxyAddress: string; response: AxiosResponse; time: number }> {
    const url = new URL(axiosRequestConfig.url);
    const host = url.host;

    if (this.bestProxies[host]?.best?.length > 0) {
      try {
        const bestAgents = Array.from(new Set(this.bestProxies[host].best)).map((proxyAddress) => {
          const agent = new SocksProxyAgent(proxyAddress);
          return { proxyAddress, agent };
        });
        const result = await this.makeRequestToProxyList(
          bestAgents,
          host,
          axiosRequestConfig,
          browseContext
        );
        return result;
      } catch (error) {
        console.log(`Best agents fails! ${url.toString()}`);
      }
    }

    const proxiesForRequest = await this.prepereProxiesListForRequest(
      host,
      browseContext.predefinedProxiesAddresses,
      browseContext.proxiesPerRequest
    );

    const agents = proxiesForRequest.map((proxyAddress) => {
      const agent = new SocksProxyAgent(proxyAddress);
      return { proxyAddress, agent };
    });

    try {
      const result = await this.makeRequestToProxyList(
        agents,
        host,
        axiosRequestConfig,
        browseContext
      );
      return result;
    } catch (error) {
      throw new Error("All agents fails!");
    }
  }

  private async makeRequestToProxyList(
    agents,
    host: string,
    axiosRequestConfig: AxiosRequestConfig<any>,
    browseContext: BrowseContext
  ): Promise<{ proxyAddress: string; response: AxiosResponse; time: number }> {
    const CancelToken = axios.CancelToken;
    const sources = [];

    return await Promise.any(
      agents.map(async ({ proxyAddress, agent }) => {
        if (this.bestProxies[host].blacklist.has(proxyAddress)) {
          throw new Error(
            `Proxy ${proxyAddress} in blacklist for ${host} host`
          );
        }

        const cancelSource = CancelToken.source();
        sources.push(cancelSource);

        const requestContext: ActiveProxyRequestContext = {
          axiosRequestConfig: {
            ...axiosRequestConfig,
            httpAgent: agent,
            httpsAgent: agent,
            timeout: browseContext.requestTimeout,
            cancelToken: cancelSource.token,
          },
          canceTokenSource: cancelSource,
          proxyUrl: proxyAddress,
          url: axiosRequestConfig.url,
        };

        browseContext.activeRequests.add(requestContext);

        const start = performance.now();

        const response = await axios(requestContext.axiosRequestConfig).finally(
          () => {
            browseContext.activeRequests.delete(requestContext);
          }
        );

        if (browseContext.isValidResponse(response)) {
          sources.forEach(({ cancel }) => cancel());
          this.setBestProxy(host, proxyAddress);
          return { proxyAddress, response, time: performance.now() - start };
        } else {
          this.blacklistProxyForHost(proxyAddress, host);
          throw new Error(
            `Validation fails for ${proxyAddress}  ${axiosRequestConfig.url}`
          );
        }
      })
    );
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
    args: BrowseArgs,
    action: (page: Page, context: BrowseContext) => Promise<T>
  ): Promise<T> {
    const browser = await connect({
      browserWSEndpoint: "ws://chromium:3000?timeout=600000",
      defaultViewport: { height: 1080, width: 1920 },
    });

    const context: BrowseContext = {
      isValidResponse: args.isValidResponse
        ? args.isValidResponse
        : (resp) => true,
      activeRequests: new Set<ActiveProxyRequestContext>(),
      predefinedProxiesAddresses: args.predefinedProxiesAddresses,
      requestTimeout: args.requestTimeout ? args.requestTimeout : 10000,
      proxiesPerRequest: args.proxiesPerRequest ? args.proxiesPerRequest : 20,
    };

    const page = await (args.incognito
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

    const result = await action(page, context);

    await page.close();
    browser.disconnect();
    return result;
  }
}

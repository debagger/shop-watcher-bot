import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProxyTestRun } from "./../../entities";
import { Repository, Not, IsNull } from "typeorm";
import { isIPPortString, ProxyListSourceExtractorService } from "./tools";
import {
  BrowseArgs,
  BrowseContext,
} from "src/browser-manager/browse-context.type";
import { BrowserManagerService } from "src/browser-manager/browser-manager.service";
import { HTTPResponse } from "puppeteer";
import { PinoLogger } from "nestjs-pino";
import { Page } from "puppeteer";

@Injectable()
export class FreeProxyCzSourceService
  implements ProxyListSourceExtractorService
{
  constructor(
    private readonly logger: PinoLogger,
    private readonly browserManager: BrowserManagerService,
    @InjectRepository(ProxyTestRun)
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>
  ) {}


  private async getBrowseProxies() {
    const successTests = await this.proxyTestRunRepo.find({
      where: {
        okResult: Not(IsNull()),
        testType: { name: "establishConnectionTest" },
      },
      order: { runTime: "DESC" },
      relations: ["testedProxy", "testType"],
      take: 100,
    });

    const predefinedProxiesAddresses = successTests.map(
      (tr) =>
        `socks${tr.protocol}://${tr.testedProxy.host}:${tr.testedProxy.port}`
    );
    return predefinedProxiesAddresses;
  }

  private async processURL<T>(
    url: string,
    evaluate: (page: Page) => Promise<T>
  ): Promise<T> {
    const predefinedProxiesAddresses = await this.getBrowseProxies();

    const browseOptions: BrowseArgs = {
      incognito: true,
      predefinedProxiesAddresses,
      requestTimeout: 30000,
      proxiesPerRequest: 50,
    };

    return await this.browserManager.browse(
      browseOptions,
      async (page, browseContext) => {
        page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
        );

        let response: HTTPResponse;
        for (let index = 0; index < 10; index++) {
          try {

            response = await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 120000,
            });

            if (response?.status() === 200) {
              return await evaluate(page);
            } else {
              this.logger.info(
                `Try #${index}. Proxy list source 'free-proxy.cz' response status ${response?.status()} (must be 200)`
              );
            }
          } catch (error) {
            this.logger.info(
              `Try #${index}. Proxy list source 'free-proxy.cz' error ${error.message}`
            );
          }
          finally {
            browseContext.activeRequests.forEach(r=>r.canceTokenSource.cancel())
          }
        }
      }
    );
  }

  private async extractProxies(page: Page) {
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll("#proxy_list >tbody >tr"))
        .filter((tr) => tr.children.length > 1)
        .map(
          (tr: any) =>
            `${tr.childNodes[0]?.innerText}:${tr.children[1]?.innerText}`
        );
    });
  }

  private async extractPageLinks(page:Page){
    return await page.evaluate(() => {
      return Array.from(
        document.querySelector(".paginator").querySelectorAll("a")
      )
        .map((a) => ({ href: a.href, text: a.innerText }))
        .filter((i) => Number.isInteger(Number(i.text)));
    });
  }

  async extract() {
    const targetURL =
      "http://free-proxy.cz/ru/proxylist/country/all/socks4/ping/all";

    const { pagesLinks, result } = await this.processURL(
      targetURL,
      async (page) => {
        const result = await this.extractProxies(page);
        const pagesLinks = await this.extractPageLinks(page);
        return { result, pagesLinks };
      }
    );

    console.log(`Get ${result.length} proxies and ${pagesLinks.length} pages from first page.`)

    for (const link of pagesLinks) {
      const pageResult = await this.processURL(link.href, async (page) => {
        return this.extractProxies(page);
      });      
      result.push(...pageResult);
      console.log(`Get ${pageResult.length} proxies pages from ${link.text} page. ${result.length} total.`)
    }
    return result;
  }


}

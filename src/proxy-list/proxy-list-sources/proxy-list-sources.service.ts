import { Injectable } from "@nestjs/common";
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
import { ProxyTestRun } from "../../entities";

const IPPortRegex =
  /(?<host>^[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}):(?<port>\d{2,5})/;

function isIPPortString(str: string) {
  return IPPortRegex.test(str);
}

function parseIPPortString(str: string) {
  const res = IPPortRegex.exec(str);
  if (!res?.groups) return;
  return { host: res.groups["host"], port: Number(res.groups["port"]) };
}

export type ProxyListExtractionResult = string[];

export type ProxyListExtractor = () => Promise<ProxyListExtractionResult>;

@Injectable()
export class ProxyListSourcesService {
  constructor(
    private readonly logger: PinoLogger,
    private browserManager: BrowserManagerService,
    @InjectRepository(ProxyTestRun)
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>
  ) {}

  private sources: Record<string, ProxyListExtractor> = {
    "www.socks-proxy.net": async () => {
      const res = await axios.get("https://www.socks-proxy.net/");
      const html = parse(res.data);
      return html
        .querySelector("textarea.form-control")
        .innerText.split("\n")
        .filter(isIPPortString);
    },
    "hidemy.name": async () => {
      const url2 = new URL("https://hidemy.name/ru/proxy-list/?type=4&start=0");
      const proxyList: string[] = [];
      let count = 0;
      while (true) {
        url2.searchParams.set("start", count.toString());
        const res = await axios.get(url2.toString());
        const html = parse(res.data);
        const proxyPageList = html
          .querySelector("tbody")
          .querySelectorAll("tr")
          .map((tr) => tr.querySelectorAll("td").map((td) => td.textContent))
          .map((t) => `${t[0]}:${t[1]}`);
        count += proxyPageList.length;
        if (proxyPageList.length === 0) break;
        proxyList.push(...proxyPageList);
      }
      return proxyList;
    },
    "spys.one": async () => {
      const successTests = await this.proxyTestRunRepo.find({
        where: { okResult: Not(IsNull()), testType: { name: "checkSpysOne" } },
        relations:['testedProxy', 'testType']
      });

      const predefinedProxiesAddresses = successTests.map(tr=>`socks${tr.protocol}://${tr.testedProxy.host}:${tr.testedProxy.port}`)

      const browseContext: BrowseContext = {
        activeRequests: new Set(),
        isValidResponse(resp) {
          return true;
        },
        predefinedProxiesAddresses,
        incognito: true
      };

      return await this.browserManager.browse(browseContext, async (page) => {
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36');
        let response: HTTPResponse;
        for (let retryNum = 1; retryNum <= 100; retryNum++) {
          response = await page.goto("https://spys.one/en/socks-proxy-list/", {
            waitUntil: "networkidle2",
            timeout: 120000,
          });
          if (response.status() === 200) break;
          console.log(
            `Retry ${retryNum}: incrrect responce status ${response.status()}. Must be 200.`
          );
          if (retryNum === 100)
            throw new Error(
              "Do not recieve correct response status after 100 reties."
            );
        }
        await page.evaluate(() => {
          document.querySelectorAll("#xpp > option")[5]["selected"] = true;
          document.querySelector("#xpp")["form"].submit();
        });

        const resp2 = await page.waitForNavigation({
          waitUntil: "domcontentloaded",
        });

        // if (resp2.status() !== 200)
        //   throw Error(
        //     `Page return wrong status (${resp2.status()}). Must be 200.`
        //   );
        const proxyList = await page.evaluate(() => {
          return Array.from(document.body.querySelectorAll("td"))
            .filter(
              (td) =>
                td.innerText.length < 25 &&
                /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}/.test(td.innerText)
            )
            .map((td) => td.innerText);
        });
        return proxyList;
      });
    },
    "free-proxy.cz": async () => {
      const targetURL =
        "http://free-proxy.cz/ru/proxylist/country/all/socks4/ping/all";

      const browseContext: BrowseContext = {
        activeRequests: new Set(),
        isValidResponse(resp) {
          return true;
        },
        incognito: true
      };
      return await this.browserManager.browse(browseContext, async (page) => {
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36');
        let resp1: HTTPResponse;
        for (let index = 0; index < 10; index++) {
          try {
            resp1 = await page.goto(targetURL, {
              waitUntil: "networkidle2",
              timeout: 60000,
            });
            browseContext.activeRequests.forEach(({ canceTokenSource }) =>
              canceTokenSource.cancel()
            );
            if (resp1?.status() === 200) {
              break;
            } else {
              this.logger.info(
                `Try #${index}. Proxy list source 'free-proxy.cz' response status ${resp1?.status()} (must be 200)`
              );
            }
          } catch (error) {
            this.logger.info(
              `Try #${index}. Proxy list source 'free-proxy.cz' error ${error.message}`
            );
          }
        }

        if (resp1?.status() !== 200)
          throw Error(
            `Page return wrong status (${resp1.status()}). Must be 200.`
          );

        const result = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("#proxy_list >tbody >tr"))
            .filter((tr) => tr.children.length > 1)
            .map(
              (tr: any) =>
                `${tr.childNodes[0]?.innerText}:${tr.children[1]?.innerText}`
            );
        });

        const pagesLinks = await page.evaluate(() => {
          return Array.from(
            document.querySelector(".paginator").querySelectorAll("a")
          )
            .map((a) => ({ href: a.href, text: a.innerText }))
            .filter((i) => Number.isInteger(Number(i.text)));
        });
        for (const link of pagesLinks) {
          let pageResp: HTTPResponse;
          for (let index = 0; index < 10; index++) {
            try {
              pageResp = await page.goto(link.href, {
                waitUntil: "networkidle2",
                timeout: 60000,
              });
              browseContext.activeRequests.forEach(({ canceTokenSource }) =>
                canceTokenSource.cancel()
              );
              if (pageResp?.status() === 200) break;
              this.logger.info(
                `Proxy list source 'free-proxy.cz'. Try #${index}.  page #${
                  link.text
                } response status ${pageResp?.status()} (must be 200)`
              );
            } catch (error) {
              this.logger.info(
                `Proxy list source 'free-proxy.cz'. Try #${index}.  page #${link.text} error ${error.message}`
              );
            }
          }
          if (pageResp?.status() !== 200) {
            this.logger.info(
              `Proxy list source 'free-proxy.cz'. Finally page #${
                link.text
              } response status ${pageResp?.status()} (must be 200)`
            );
            continue;
          }
          const pageResult = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll("#proxy_list >tbody >tr")
            )
              .filter((tr) => tr.children.length > 1)
              .map(
                (tr: any) =>
                  `${tr.children[0]?.innerText}:${tr.children[1]?.innerText}`
              );
          });
          result.push(...pageResult);
        }
        return result;
      });
    },
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
    const extractionResult = await this.sources[sourceName]();
    return extractionResult.map((item) => parseIPPortString(item));
  }
}

import { Injectable } from "@nestjs/common";

import { PinoLogger } from "nestjs-pino";
import { Page, HTTPResponse } from "puppeteer";

import {
  LinkCheckResultMulticolors,
  Size,
  Color,
} from "../chat-data-storage/chat-links.interface";
import { parse } from "node-html-parser";
import { BrowserManagerService } from "../browser-manager/browser-manager.service";
import { BrowseContext } from "./../browser-manager/browse-context.type";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { ProxyTestRun } from "../entities";

type SiteCrawlerTaskEntry = {
  targetURL: string;
  task: Promise<LinkCheckResultMulticolors>;
};

@Injectable()
export class SiteCrawlerService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly browserManager: BrowserManagerService,
    @InjectRepository(ProxyTestRun)
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>
  ) {
    logger.setContext(SiteCrawlerService.name);
  }

  private async extractProductInfo(
    page: Page
  ): Promise<LinkCheckResultMulticolors> {
    const data = await page.evaluate(() => window["zara"]);
    const zaraProduct = data?.viewPayload?.product;
    const name = zaraProduct.name;
    const colors = zaraProduct.detail?.colors?.map((zaraColor) => {
      const color: Color = { code: zaraColor.hexCode, name: zaraColor.name };
      return {
        color,
        sizes: zaraColor.sizes?.map((zaraSize) => {
          const result: Size = {
            size: zaraSize.name,
            disabled: zaraSize.availability !== "in_stock",
          };
          return result;
        }),
      };
    });

    const result: LinkCheckResultMulticolors = {
      name,
      colors,
    };
    return result;
  }

  private async makeRequest(
    targetURL: string
  ): Promise<LinkCheckResultMulticolors> {
    const successTests = await this.proxyTestRunRepo.find({
      where: { okResult: Not(IsNull()), testType: { name: "checkZara" } },
      order: { runTime: "DESC" },
      relations: ["testedProxy", "testType"],
      take: 10,
    });

    const predefinedProxiesAddresses = successTests.map(
      (tr) =>
        `socks${tr.protocol}://${tr.testedProxy.host}:${tr.testedProxy.port}`
    );

    const result = await this.browserManager.browse(
      { predefinedProxiesAddresses, incognito: true },
      async (page, browseContext) => {
        try {
          page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
          );
          page.setGeolocation({ latitude: 55.751244, longitude: 37.618423 }); //Moscow

          await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "language", {
              get: function () {
                return "ru-RU";
              },
            });

            Object.defineProperty(navigator, "languages", {
              get: function () {
                return ["ru-RU", "ru"];
              },
            });
          });

          this.logger.info({ targetURL }, "Opened new page in browser");

          let gotoResult: HTTPResponse;
          for (let i = 1; i <= 5; i++) {
            try {
              gotoResult = null;
              gotoResult = await page.goto(targetURL, {
                waitUntil: "domcontentloaded",
                timeout: 60000,
              });
            } catch (error) {
              console.log(error.message);
            }
            console.log(
              `Navigation finished. Canceling ${browseContext.activeRequests.size} active requests`
            );

            browseContext.activeRequests.forEach(({ canceTokenSource }) =>
              canceTokenSource.cancel()
            );

            if (!gotoResult) {
              console.log(`No result. Retry ${i}`);
              continue;
            }

            if (gotoResult.status() !== 200) {
              console.log(
                `Page response status: ${gotoResult.status()}. Must be 200. Retry ${i}`
              );
              continue;
            }

            break;
          }

          if (!gotoResult) {
            this.logger.error(
              { targetURL },
              `Target URL navigate error. No response.`
            );
            throw new Error("Target URL navigate error. No response.");
          }

          const status = gotoResult.status();

          if (status !== 200) {
            const msg = (await gotoResult.text()).substring(0, 200) + "...";
            this.logger.error(
              { targetURL, msg },
              `Target URL navigate error. Status  code: ${status} (must be 200)`
            );
            throw new Error(
              `Target URL navigate error. Status  code: ${status} (must be 200)`
            );
          }

          this.logger.info(
            {
              targetURL,
              status,
              statusText: gotoResult.statusText(),
            },
            `Opened targetURL in browser. Status code: ${status}`
          );

          const name = await page.evaluate(() => {
            const productName: string =
              globalThis.zara?.viewPayload?.product?.name;
            return productName;
          });

          if (!name) {
            await page.screenshot({ path: "screenshot.jpg", type: "jpeg" });
            await page.close();
            throw new Error("Product name not found");
          }

          this.logger.info(
            { targetURL, productName: name },
            "Product name extracted from page"
          );

          const productInfo = await this.extractProductInfo(page);

          this.logger.info(
            {
              targetURL,
              productName: name,
              productSizes: Object.assign(
                {},
                ...productInfo.colors.map((c) => ({
                  [c.color.name]: Object.assign(
                    {},
                    ...c.sizes.map((s) => ({ [s.size]: s.disabled }))
                  ),
                }))
              ),
            },
            "Sizes extracted from page"
          );

          return productInfo;
        } catch (err) {
          this.logger.error(err, "Error when try to get product data");
          throw err;
        }
      }
    );
    return result;
  }

  private prevTask: Promise<any> = Promise.resolve();

  private pendingRequestsSet = new Set<SiteCrawlerTaskEntry>();

  public getPendingRequests(): string[] {
    const result = [];
    this.pendingRequestsSet.forEach((item) => result.push(item.targetURL));
    return result;
  }

  public getData(targetURL: string): Promise<LinkCheckResultMulticolors> {
    const task = new Promise<LinkCheckResultMulticolors>((resolve, reject) => {
      this.prevTask.finally(() => {
        this.makeRequest(targetURL)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
    const taskEntry = { targetURL, task };

    this.pendingRequestsSet.add(taskEntry);
    task.finally(() => this.pendingRequestsSet.delete(taskEntry));
    this.prevTask = task;
    return task;
  }
}

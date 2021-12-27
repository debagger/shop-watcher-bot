import { Injectable } from "@nestjs/common";

import { PinoLogger } from "nestjs-pino"
import { Page, HTTPResponse } from "puppeteer";

import { LinkCheckResultMulticolors, Size, Color } from "../chat-data-storage/chat-links.interface";
import { parse } from 'node-html-parser';
import { BrowserManagerService } from "../browser-manager/browser-manager.service";
import { BrowseContext } from "./../browser-manager/browse-context.type";

@Injectable()
export class SiteCrawlerService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly browserManager: BrowserManagerService
  ) {
    logger.setContext(SiteCrawlerService.name);
  }

  private async extractProductInfo(page: Page): Promise<LinkCheckResultMulticolors> {
    const data = await page.evaluate(() => window['zara'])
    const zaraProduct = data?.viewPayload?.product
    const name = zaraProduct.name
    const colors = zaraProduct.detail?.colors?.map((zaraColor => {
      const color: Color = { code: zaraColor.hexCode, name: zaraColor.name }
      return {
        color, sizes: zaraColor.sizes?.map(zaraSize => {
          const result: Size = { size: zaraSize.name, disabled: zaraSize.availability !== 'in_stock' }
          return result
        })
      }
    }))

    const result: LinkCheckResultMulticolors = {
      name,
      colors,
    }
    return result;
  }

  private async makeRequest(targetURL: string): Promise<LinkCheckResultMulticolors> {

    const browseContext: BrowseContext = {
      url: targetURL,
      activeRequestCancellers: new Set(),
      isValidResponse(resp) {
        if (resp.headers['content-type'].startsWith('text/html')) {
          try {
            const htmlTag = parse(resp.data).querySelector('html')
            console.dir(htmlTag?.attributes)
            const result = htmlTag?.attributes["lang"] === 'ru-RU'
            console.log(`Result isValid = ${result}`)
            return result
          } catch (error) {
            return false
          }
        }
        return true
      }
    }

    const result = await this.browserManager.browse(browseContext, async (page) => {
      try {

        page.setGeolocation({ latitude: 55.751244, longitude: 37.618423 }) //Moscow

        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, "language", {
            get: function () {
              return "ru-RU";
            }
          });

          Object.defineProperty(navigator, "languages", {
            get: function () {
              return ["ru-RU", "ru"];
            }
          });
        });

        this.logger.info({ targetURL }, "Opened new page in browser");

        let gotoResult: HTTPResponse
        for (let i = 1; i <= 5; i++) {
          gotoResult = await page.goto(targetURL, { waitUntil: "domcontentloaded", timeout: 60000 });

          console.log(`Navigation finished. Canceling ${browseContext.activeRequestCancellers.size} active requests`)

          browseContext.activeRequestCancellers.forEach(cancelSource => cancelSource.cancel())

          if (!gotoResult) {
            console.log(`No result. Retry ${i}`)
            continue
          }

          if (gotoResult.status() !== 200) {
            console.log(`Page response status: ${gotoResult.status()}. Must be 200. Retry ${i}`)
            continue
          }

          break

        }


        if (!gotoResult) {
          this.logger.error({ targetURL }, `Target URL navigate error. No response.`)
          throw new Error("Target URL navigate error. No response.")
        }


        const status = gotoResult.status();

        if (status !== 200) {
          const msg = (await gotoResult.text()).substring(0, 200) + "..."
          this.logger.error({ targetURL, msg }, `Target URL navigate error. Status  code: ${status} (must be 200)`)
          throw new Error(`Target URL navigate error. Status  code: ${status} (must be 200)`)
        }

        this.logger.info({
          targetURL,
          status,
          statusText: gotoResult.statusText()
        }, `Opened targetURL in browser. Status code: ${status}`);

        const name = await page.evaluate(() => {
          const productName = document.querySelector<HTMLElement>(
            ".product-detail-info__name"
          );
          return productName?.innerText;
        });

        if (!name) {
          await page.screenshot({ path: 'screenshot.jpg', type: 'jpeg' })
          await page.close()
          throw new Error("Product name not found")
        };

        this.logger.info({ targetURL, productName: name }, "Product name extracted from page");

        const productInfo = await this.extractProductInfo(page)

        this.logger.info({
          targetURL,
          productName: name,
          productSizes: Object.assign({},
            ...productInfo.colors.map(c => ({
              [c.color.name]: Object.assign({},
                ...c.sizes.map(s => ({ [s.size]: s.disabled })))
            })))
        }, "Sizes extracted from page");

        return productInfo

      } catch (err) {
        this.logger.error(err, "Error when try to get product data")
        throw err;
      }
    })
    return result;
  }

  private prevTask: Promise<any> = Promise.resolve()

  public getData(targetURL: string): Promise<LinkCheckResultMulticolors> {
    const task = new Promise<LinkCheckResultMulticolors>((resolve, reject) => {
      this.prevTask.finally(() => {
        this.makeRequest(targetURL).then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
      })
    }
    )
    this.prevTask = task
    return task
  }
}

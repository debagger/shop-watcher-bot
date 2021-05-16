import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino"
import { launch, connect, Browser } from "puppeteer";
import { LinkCheckResult, Size } from "../file-db/chat-links.interface";

@Injectable()
export class SiteCrawlerService {
  constructor(private readonly logger: PinoLogger) {
    logger.setContext(SiteCrawlerService.name);
  }
  private async makeRequest(targetURL: string): Promise<LinkCheckResult> {
    let browser: Browser;
    try {
      browser = await connect({ browserURL: "http://chromium:3000", defaultViewport: { height: 1080, width: 1920 } });
      this.logger.info({ targetURL }, "Connected to browser");
      const page = await browser.newPage();
      this.logger.info({ targetURL }, "Open new page in browser");
      await page.goto(targetURL, { waitUntil: "networkidle2", timeout: 120000 });
      this.logger.info({ targetURL }, "Open targetURL in browser");
      const name = await page.evaluate(() => {
        const productName = document.querySelector<HTMLElement>(
          ".product-detail-info__name"
        );
        if (productName) return productName.innerText;
        return;
      });

      this.logger.info({ targetURL, productName: name }, "Get product name from page");

      const sizes: Size[] = await page.evaluate(() => {
        const productSize = document.querySelector<HTMLElement>(
          ".product-size-selector__size-list"
        );
        if (productSize) {
          return Array.from(productSize.children)
            .map((i: HTMLElement) => {
              return {
                size: i.innerText,
                disabled: !!((<any>i.attributes).disabled),
              };
            });
        } else {
          return [];
        }
      });

      this.logger.info({
        targetURL,
        productName: name,
        productSizes: sizes
      }, "Get sizes from page");

      return { name, sizes };
    } catch (err) {
      this.logger.error(err, "Error when try to get product data")
      throw err;
    } finally {
      browser.disconnect()
      this.logger.info({ targetURL }, "Disconnected from browser");
    }
  }

  private prevTask: Promise<LinkCheckResult>

  async getData(targetURL: string): Promise<LinkCheckResult> {
    const task = new Promise<LinkCheckResult>((resolve, reject) => {
      if (this.prevTask) {
        this.prevTask.finally(() => {
          this.makeRequest(targetURL).then(resolve).catch(reject)
        })
      }
      else {
        this.makeRequest(targetURL).then(resolve).catch(reject)
      }
    })
    this.prevTask = task
    return task
  }
}

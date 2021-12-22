import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino"
import { launch, connect, Browser, Page } from "puppeteer";
import { LinkCheckResultType, LinkCheckResultMulticolors, LinkCheckResultSimple, Size, LinkCheckResultBase, Color } from "../chat-data-storage/chat-links.interface";

@Injectable()
export class SiteCrawlerService {
  constructor(private readonly logger: PinoLogger) {
    logger.setContext(SiteCrawlerService.name);
  }

  private async isSimpleOrMulticolorSizesSelector(page: Page): Promise<LinkCheckResultType> {
    const colorSelectorButtonsCount = await page.evaluate(() => {
      const selectorButtons = document.getElementsByClassName('product-detail-color-selector__color-button');
      return selectorButtons.length;
    })
    return colorSelectorButtonsCount > 0 ? 'multicolors' : 'simple'
  }

  private async getSizesFromPage(page: Page): Promise<Size[]> {
    const sizes: Size[] = await page.evaluate(() => {
      const productSize = document.querySelector<HTMLElement>(
        ".product-detail-size-selector__size-list"
      );
      if (productSize) {
        return Array.from(productSize.children)
          .map((i: HTMLElement) => {
            return {
              size: i.querySelector<HTMLElement>(".product-detail-size-info__main-label").innerText,
              disabled: !!((<any>i.attributes).disabled || i.classList.contains("product-detail-size-selector__size-list-item--is-disabled")),
            };
          });
      } else {
        return [];
      }
    });
    return sizes
  }

  private async getColorsSizesFromPage(page: Page): Promise<{ color: Color; sizes: Size[] }[]> {
    const colors = await page.evaluate(() => {
      const colors = Array.from(document.getElementsByClassName('product-detail-color-selector__color-button') as HTMLCollectionOf<HTMLButtonElement>)

      const result: { color: Color; sizes: Size[] }[] = []

      for (let color of colors) {

        color.click();

        let colorCode = ""
        const colorElement = color.getElementsByClassName('product-detail-color-selector__color-area')[0] as HTMLSpanElement

        if (colorElement) {
          colorCode = colorElement.style.backgroundColor
        }

        const resultColor: Color = { name: color.innerText, code: colorCode };

        const productSize = document.querySelector<HTMLUListElement>(
          ".product-detail-size-selector__size-list"
        );

        if (productSize) {
          const colorSizes = Array.from(productSize.children)
            .map((i: HTMLElement) => {
              return {
                size: i.querySelector<HTMLElement>(".product-detail-size-info__main-label").innerText,
                disabled: !!((<any>i.attributes).disabled) || i.classList.contains("product-detail-size-selector__size-list-item--is-disabled"),
              };
            });
          result.push({ color: resultColor, sizes: colorSizes })
        }
      }
      return result;

    });
    return colors;
  }

  private async makeRequest(targetURL: string): Promise<LinkCheckResultSimple | LinkCheckResultMulticolors> {
    let browser: Browser;
    try {
      browser = await connect({ browserURL: "http://chromium:3000", defaultViewport: { height: 1080, width: 1920 } });
      this.logger.info({ targetURL }, "Connected to browser");
      const page = await browser.newPage();
      this.logger.info({ targetURL }, "Opened new page in browser");
      const gotoResult = await page.goto(targetURL, { waitUntil: "networkidle2", timeout: 120000 });

      const status = gotoResult.status();
      if (status !== 200) {
        const msg = (await gotoResult.text()).substring(0, 200) + "..."
        this.logger.error({ targetURL, msg }, `Target URL navigate error. Status  code: ${status} (must be 200)`)
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

      if (!name) throw new Error("Product name not found");

      this.logger.info({ targetURL, productName: name }, "Product name extracted from page");

      const type = await this.isSimpleOrMulticolorSizesSelector(page);

      switch (type) {
        case 'simple': {
          const sizes = await this.getSizesFromPage(page);
          this.logger.info({
            targetURL,
            productName: name,
            productSizes: sizes
          }, "Sizes extracted from page");

          return { type, name, sizes };
          break;
        }
        case 'multicolors': {
          const colors = await this.getColorsSizesFromPage(page)
          this.logger.info({
            targetURL,
            productName: name,
            productSizes: Object.assign({},
              ...colors.map(c => ({
                [c.color.name]: Object.assign({},
                  ...c.sizes.map(s => ({ [s.size]: s.disabled })))
              })))
          }, "Sizes extracted from page");

          return { type, name, colors }
          break;
        }
      }


    } catch (err) {
      this.logger.error(err, "Error when try to get product data")
      throw err;
    } finally {
      browser.disconnect()
      this.logger.info({ targetURL }, "Disconnected from browser");
    }
  }

  private prevTask: Promise<LinkCheckResultSimple | LinkCheckResultMulticolors>

  async getData(targetURL: string): Promise<LinkCheckResultSimple | LinkCheckResultMulticolors> {
    const task = new Promise<LinkCheckResultSimple | LinkCheckResultMulticolors>((resolve, reject) => {
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

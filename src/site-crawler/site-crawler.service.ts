import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { launch, Browser } from "puppeteer";
import { LinkCheckResult, Size } from "src/file-db/chat-links.interface";

@Injectable()
export class SiteCrawlerService implements OnModuleDestroy {
  async onModuleDestroy() {
    if (this.browser && this.browser.isConnected()) {
      await this.browser.close();
    }
  }
  
  async init() {
    this.browser = await launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  private browser: Browser;

  async getData(path: string): Promise<LinkCheckResult> {
    if (!(this.browser && this.browser.isConnected())) await this.init();

    const page = await this.browser.newPage();
    await page.setViewport({ height: 1080, width: 1920 });
    await page.goto(path, { waitUntil: "networkidle2" });
    try {
      const name = await page.evaluate(() => {
        const productName = document.querySelector<HTMLElement>(
          ".product-name"
        );
        if (productName) {
          return productName.innerText.replace("\nПОДРОБНАЯ ИНФОРМАЦИЯ", "");
        }
        return "";
      });

      const sizes: Size[] = await page.evaluate(() => {
        const productSize = document.querySelectorAll<HTMLElement>(
          ".product-size"
        );
        if (productSize) {
          return Array.from(productSize)
            .filter((i: HTMLElement) => i.dataset)
            .map((i: HTMLElement) => {
              return {
                size: i.dataset.name ? i.dataset.name : "",
                disabled: !(i.className.search("disabled") < 0),
              };
            });
        } else {
          return [];
        }
      });

      return { name, sizes };
    } catch (err) {
      console.log("Error path = ", path);
      console.log(err.toString());
      throw err;
    } finally {
      if (!page.isClosed()) {
        await page.close();
      }
    }
  }
}

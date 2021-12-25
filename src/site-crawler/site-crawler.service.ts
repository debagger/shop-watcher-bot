import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders, CancelTokenSource, Method } from "axios";
import { PinoLogger } from "nestjs-pino"
import { connect, Page, HTTPRequest, HTTPResponse } from "puppeteer";
import { SocksProxyAgent } from "socks-proxy-agent";
import { Proxy, ProxyListUpdate, ProxyTestRun } from "src/entities";
import { Repository } from "typeorm";
import { LinkCheckResultType, LinkCheckResultMulticolors, LinkCheckResultSimple, Size, LinkCheckResultBase, Color } from "../chat-data-storage/chat-links.interface";
import { performance } from 'perf_hooks'
import { parse } from 'node-html-parser';

type BrowseContext = {
  url: string,
  isValidResponse: (response: AxiosResponse) => boolean
  activeRequestCancellers: Set<CancelTokenSource>
}

@Injectable()
export class SiteCrawlerService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Proxy) private readonly proxyRepo: Repository<Proxy>,
    @InjectRepository(ProxyTestRun) private readonly proxyTestRunRepo: Repository<ProxyTestRun>,
    @InjectRepository(ProxyListUpdate) private readonly proxyListUpdatesRepo: Repository<ProxyListUpdate>
  ) {
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

  private readonly bestProxies: Record<string, { best: string[], blacklist: Set<string> }> = {}

  private async getProxiedResponse(
    axiosRequestConfig: AxiosRequestConfig, browseContext: BrowseContext, page: Page
  ): Promise<{ proxyAddress: string; response: AxiosResponse; time: number }> {

    const url = new URL(axiosRequestConfig.url)
    const host = url.host

    const getRandomsFromArray = <T>(arr: T[], count: number) => {
      const res: T[] = []
      for (let index = 0; index < count; index++) {
        const random_idx = Math.floor(Math.random() * (arr.length - 1))
        res.push(arr[random_idx])
      }
      return res
    }

    if (!this.bestProxies[host]) {
      this.bestProxies[host] = {
        best: [],
        blacklist: new Set()
      }
    }

    const proxies = await this.proxyRepo.find({
      order: { id: 'DESC' },
      take: 500
    })

    const proxyAdressess = Array
      .from(new Set(proxies
        .map(p => `socks4://${p.host}:${p.port}`)
        .filter(i => !this.bestProxies[host].blacklist.has(i))
      ))


    if (this.bestProxies[host].best.length === 0) {
      this.bestProxies[host].best = getRandomsFromArray(proxyAdressess, 100)
    }

    const proxiesForRequest = Array.from(new Set([...getRandomsFromArray(this.bestProxies[host].best, 25), ...getRandomsFromArray(proxyAdressess, 25)]))

    const agents = proxiesForRequest.map(proxyAddress => {
      const agent = new SocksProxyAgent(proxyAddress)
      return { proxyAddress, agent }
    })

    const CancelToken = axios.CancelToken;
    const sources = [];

    try {
      const result = await Promise.any(agents.map(async ({ proxyAddress, agent }) => {
        if (this.bestProxies[host].blacklist.has(proxyAddress)) {
          throw new Error(`Proxy ${proxyAddress} in blacklist for ${host} host`)
        }

        const cancelSource = CancelToken.source();

        browseContext.activeRequestCancellers.add(cancelSource)

        sources.push(cancelSource);
        const start = performance.now()
        const response = await axios({
          ...axiosRequestConfig,
          httpAgent: agent,
          httpsAgent: agent,
          timeout: 10000,
          cancelToken: cancelSource.token
        }).finally(() => {
          browseContext.activeRequestCancellers.delete(cancelSource)
        });

        if (browseContext.isValidResponse(response)) {
          sources.forEach(({ cancel }) => cancel())
          this.bestProxies[host].best.push(proxyAddress)

          while (this.bestProxies[host].best.length > 1000) {
            this.bestProxies[host].best.shift()
          }

          return { proxyAddress, response, time: performance.now() - start }
        } else {
          console.log(`Proxy ${proxyAddress} blacklisted for ${host} host`)
          this.bestProxies[host].best = this.bestProxies[host].best.filter(i => i !== proxyAddress)
          this.bestProxies[host].blacklist.add(proxyAddress)
          throw new Error(`Validation fails for ${proxyAddress}  ${axiosRequestConfig.url}`)
        }

      }))

      return result
    } catch (error) {
      throw new Error("All requests fails!")
    }
  }

  private async browserRequestInteceptor(interceptedRequest: HTTPRequest, context: BrowseContext, page: Page) {

    if (interceptedRequest.url().startsWith("data:")) {
      return await interceptedRequest.continue()
    }
    try {

      const config: AxiosRequestConfig = {
        url: interceptedRequest.url(),
        method: <Method>interceptedRequest.method(),
        data: interceptedRequest.postData(),
        headers: interceptedRequest.headers(),
        responseType: 'arraybuffer',
        maxRedirects: 0
      }

      const { response: res, proxyAddress, time } = await this.getProxiedResponse(config, context, page)
      await interceptedRequest.respond({ body: res.data, headers: res.headers, status: res.status, contentType: res.headers["content-type"] });

      console.log(`(${Math.floor(time)}ms) From ${proxyAddress} get ${interceptedRequest.url()}`);

    } catch (error) {
      console.error(error.message + ' ' + interceptedRequest.url())
      await interceptedRequest.respond({
        body: 'Proxy error',
        headers: { "content-type": "text/plain charset=utf-8" },
        status: 500,
        contentType: "text/plain charset=utf-8"
      }).catch(err => console.error(err));
    }
  }

  private async browse<T>(context: BrowseContext, action: (page: Page) => Promise<T>): Promise<T> {
    const browser = await connect({ browserWSEndpoint: 'ws://chromium:3000?timeout=300000', defaultViewport: { height: 1080, width: 1920 } });
    const page = await browser.newPage();

    page.once('close', () => {
      console.log(`Cancel ${context.activeRequestCancellers.size} active requests due to page close`)
      context.activeRequestCancellers.forEach(source => source.cancel())
    })

    await page.setRequestInterception(true);

    page.on('request', (request) => this.browserRequestInteceptor(request, context, page));

    const result = await action(page);
    await page.close()
    browser.disconnect()
    return result
  }

  private async makeRequest(targetURL: string): Promise<LinkCheckResultSimple | LinkCheckResultMulticolors> {

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

    const result = await this.browse(browseContext, async (page) => {
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
          gotoResult = await page.goto(targetURL, { waitUntil: "networkidle2", timeout: 300000 });

          console.log(`Navigation finished. Canceling ${browseContext.activeRequestCancellers.size} active requests`)

          browseContext.activeRequestCancellers.forEach(cancelSource => cancelSource.cancel())

          if (!gotoResult) {
            console.log(`No result. Retry ${i}`)
            continue
          }

          if (gotoResult.status() !== 200) {
            console.log(`Page response status: ${gotoResult.status()}. Must be 200. Retry ${i}`)
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
      }
    })
    return result;
  }

  private prevTask: Promise<LinkCheckResultSimple | LinkCheckResultMulticolors>

  public getData(targetURL: string): Promise<LinkCheckResultSimple | LinkCheckResultMulticolors> {
    const task = new Promise<LinkCheckResultSimple | LinkCheckResultMulticolors>((resolve, reject) => {
      if (this.prevTask) {
        this.prevTask.finally(() => {
          this.makeRequest(targetURL).then((res) => {
            resolve(res)
          }).catch((err) => {
            reject(err)
          })
        })
      }
      else {
        this.makeRequest(targetURL).then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
      }
    })
    this.prevTask = task
    return task
  }
}

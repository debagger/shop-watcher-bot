import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProxyTestRun } from "./../../entities";
import { BrowserManagerService } from "./../../browser-manager/browser-manager.service";
import { ProxyListSourceExtractorService } from "./tools";
import { Repository, IsNull, Not } from "typeorm";
import { BrowseContext } from "./../../browser-manager/browse-context.type";
import { HTTPResponse } from "puppeteer";

@Injectable()
export class SpysOneSourceService implements ProxyListSourceExtractorService {
  constructor(
    private readonly browserManager: BrowserManagerService,
    @InjectRepository(ProxyTestRun)
    private readonly proxyTestRunRepo: Repository<ProxyTestRun>
  ) {}

  async extract() {
    const successTests = await this.proxyTestRunRepo.find({
      where: { okResult: Not(IsNull()), testType: { name: "checkSpysOne" } },
      order: { runTime: "DESC" },
      relations: ["testedProxy", "testType"],
      take: 30,
    });

    const predefinedProxiesAddresses = successTests.map(
      (tr) =>
        `socks${tr.protocol}://${tr.testedProxy.host}:${tr.testedProxy.port}`
    );

    return await this.browserManager.browse(
      { predefinedProxiesAddresses, incognito: true },
      async (page, browseContext) => {
        page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
        );

        let response: HTTPResponse = null;
        for (let retryNum = 1; retryNum <= 10; retryNum++) {
          try {
            response = null;
            response = await page.goto(
              "https://spys.one/en/socks-proxy-list/",
              {
                waitUntil: "networkidle2",
                timeout: 120000,
              }
            );
          } catch (error) {
            console.log(error.message);
          }

          if (response?.status() === 200) {
            try {
              await page.evaluate(() => {
                document.querySelectorAll("#xpp > option")[5]["selected"] =
                  true;
                document.querySelector("#xpp")["form"].submit();
              });
              break;
            } catch (error) {
              console.log(`Error submit form. Message ${error.message} `);
            }
          } else {
            console.log(
              `Retry ${retryNum}: incorrect responce status ${response.status()}. Must be 200.`
            );
          }

          if (retryNum === 10)
            throw new Error(
              "Do not recieve correct response status after 10 reties."
            );
        }

        try {
          const resp2 = await page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 120000
          });

          const proxyList = await page.evaluate(() => {
            return Array.from(document.body.querySelectorAll("td"))
              .filter(
                (td) =>
                  td.innerText.length < 25 &&
                  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}/.test(
                    td.innerText
                  )
              )
              .map((td) => td.innerText);
          });
          return proxyList;
        } catch (error) {
          throw new Error(
            `spys.one proxy source update error: ${error.message}`
          );
        } finally {
          browseContext.activeRequests.forEach((r) =>
            r.canceTokenSource.cancel()
          );
        }
      }
    );
  }
}

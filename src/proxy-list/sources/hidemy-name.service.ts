import { Injectable } from "@nestjs/common";
import { isIPPortString, ProxyListSourceExtractorService } from "./tools";
import axios from "axios";
import { parse } from "node-html-parser";

@Injectable()
export class HidemyNameSourceService implements ProxyListSourceExtractorService {
    async extract(){
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
    }
}
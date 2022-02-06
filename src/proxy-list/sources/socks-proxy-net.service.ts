import { Injectable } from "@nestjs/common";
import { isIPPortString, ProxyListSourceExtractorService } from "./tools";
import axios from "axios";
import { parse } from "node-html-parser";

@Injectable()
export class SocksProxyNetSourceService implements ProxyListSourceExtractorService {
    async extract(){
        const res = await axios.get("https://www.socks-proxy.net/");
        const html = parse(res.data);
        return html
          .querySelector("textarea.form-control")
          .innerText.split("\n")
          .filter(isIPPortString);
    }
}
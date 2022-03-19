import axios from "axios";
import { AxiosResponse } from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ProxyTestArgs } from "./proxy-test.type";
import { performance } from "perf_hooks";
import * as tls from 'tls'
import * as crypto from 'crypto'
export async function checkWebsite(
  url: string,
  options: ProxyTestArgs,
  checkResponse?: (response: AxiosResponse) => void
) {
  const { host, port, protocol: type } = options;
  const result: { okResult?: any; errorResult?: any; duration_ms: number } = {
    duration_ms: NaN,
  };
  const timeout = 60000;

  const defaultCiphers = crypto.constants.defaultCoreCipherList.split(':');

  const ciphers = [ //Chrome order
    defaultCiphers[2],    
    defaultCiphers[0],
    defaultCiphers[1],
    ...defaultCiphers.slice(3)
].join(':');

  const httpsAgent = new SocksProxyAgent({ host, port, type, timeout, tls:{ciphers} });

  const start = performance.now();

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "ru-RU,ru;q=0.9",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "upgrade-insecure-requests": "1",
    "accept-ancoding": "gzip, deflate"
  };

  try {
    const response = await axios.get(url, {
      httpsAgent,
      timeout,
      headers
    });

    result.duration_ms = performance.now() - start;
    Object.freeze(response);
    if (checkResponse) checkResponse(response);
    result.okResult = { status: response.status };
  } catch (error) {
    result.duration_ms = performance.now() - start;
    result.errorResult = error;
  }

  return result;
}

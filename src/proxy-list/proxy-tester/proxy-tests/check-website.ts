import axios from 'axios';
import { AxiosResponse } from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ProxyTestArgs } from './proxy-test.type'
import { performance } from 'perf_hooks'

export async function checkWebsite(url: string, options: ProxyTestArgs, checkResponse?: (response: AxiosResponse) => void) {

    const { host, port, protocol: type } = options
    const result: { okResult?: any, errorResult?: any, duration_ms: number } = { duration_ms: NaN }
    const timeout = 60000

    const httpsAgent = new SocksProxyAgent({ host, port, type, timeout })

    const start = performance.now()
    try {
        const response = await axios.get(url, { httpsAgent, timeout });
        result.duration_ms = performance.now() - start;
        Object.freeze(response)
        if (checkResponse) checkResponse(response)
        result.okResult = { status: response.status }

    } catch (error) {
        result.duration_ms = performance.now() - start;
        result.errorResult = error
    }

    return result
}
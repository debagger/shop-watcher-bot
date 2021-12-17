import axios from 'axios';
import {  AxiosResponse } from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ProxyTestArgs } from './proxy-test.type'

export async function checkWebsite(url: string, options: ProxyTestArgs, checkResponse?: (response: AxiosResponse) => void) {

    const { host, port, protocol: type } = options
    const result: { okResult?: any, errorResult?: any } = {}
    const timeout = 60000

    const httpsAgent = new SocksProxyAgent({ host, port, type, timeout })

    try {
        const response = await axios.get(url, { httpsAgent, timeout });
        Object.freeze(response)
        if(checkResponse) checkResponse(response)
        result.okResult = { status: response.status }
    } catch (error) {
        result.errorResult = error
    }
    return result
}
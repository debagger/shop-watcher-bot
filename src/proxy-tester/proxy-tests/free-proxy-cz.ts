import { ProxyTestArgs, ProxyTestType } from './proxy-test.type'
import { checkWebsite } from './check-website'

export const checkFreeProxyCz: ProxyTestType = async function (options: ProxyTestArgs) {
    const checkResult = await checkWebsite("http://free-proxy.cz/ru/proxylist/country/all/socks4/ping/all", options)
    return {
        name: "checkFreeProxyCz",
        ...options,
        ...checkResult
    }
}

import { ProxyTestArgs, ProxyTestType } from './proxy-test.type'
import { checkWebsite } from './check-website'

export const checkSpysOne: ProxyTestType = async function (options: ProxyTestArgs) {
    const checkResult = await checkWebsite("https://spys.one/proxies/", options)
    return {
        name: "checkSpysOne",
        ...options,
        ...checkResult
    }
}
import { ProxyTestArgs, ProxyTestType } from './proxy-test.type'
import { checkWebsite } from './check-website'

export const checkZara: ProxyTestType = async function (options: ProxyTestArgs) {
    const checkResult = await checkWebsite("https://www.zara.com/ru/", options)
    return {
        name: "checkZara",
        ...options,
        ...checkResult
    }

}
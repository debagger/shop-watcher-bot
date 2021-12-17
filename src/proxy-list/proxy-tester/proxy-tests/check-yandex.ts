import { parse } from 'node-html-parser';
import { ProxyTestArgs, ProxyTestType } from './proxy-test.type'
import { checkWebsite } from './check-website'

export const checkYandex: ProxyTestType = async function (options: ProxyTestArgs) {
    const checkResult = await checkWebsite("https://ya.ru", options, (response) => {
        const html = parse(response.data)
        const title = html.querySelector('title')?.textContent
        if (title !== 'Яндекс') {
            throw Error(`Wrong content ${title}`)
        }
    })

    return {
        name: "checkYandex",
        ...options,
        ...checkResult
    }

}
import axios from 'axios';
import process from 'process';
import puppeteer from "puppeteer";
// import useProxy from 'puppeteer-page-proxy'
import SocksProxyAgent from 'socks-proxy-agent';
import promiseAny from 'promise.any'

// process.on('exit', code => {
//     console.log(`Exit with code ${code}`)
// })

const proxyListResp = await axios.get('https://proxylist.geonode.com/api/proxy-list?limit=50&page=1&sort_by=lastChecked&sort_type=desc&protocols=socks4%2Csocks5');
const proxies = proxyListResp.data.data;
const proxyAdressess = proxies.map(p => `socks4://${p.ip}:${p.port}`)
const agents = proxyAdressess.map(proxyAddress => ({ proxyAddress, agent: new SocksProxyAgent(proxyAddress) }))

console.log(`${proxyAdressess.length} total proxies`);

async function getProxiesStatus() {
    const result = await Promise.all(agents.map(async ({ proxyAddress, agent }) => {
        try {
            const response = await axios.get('https://www.zara.com/ru/', { httpsAgent: agent, timeout: 10000 });
            console.log(`${proxyAddress}: ${response.status}`);
            return { proxyAddress, response }
        } catch (error) {
            console.error(`${proxyAddress}: ${error.message}`);
            return { proxyAddress, error }
        }
    }))

    return result
}

async function getProxiedResponse(axiosRequestConfig) {

    const CancelToken = axios.CancelToken;
    const sources = [];
    try {
        const result = await promiseAny(agents.map(async ({ proxyAddress, agent }) => {
            const source = CancelToken.source();
            sources.push(source);
            const response = await axios({
                ...axiosRequestConfig,
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 10000,
                cancelToken: source.token
            });
            sources.forEach(({ cancel }) => cancel())
            return { proxyAddress, response }
        }))
        return result
    } catch (error) {
        throw new Error("All requests fails!")
    }


}

// async function test() {
//     const { proxyAddress, response } = await getProxiedResponse({ url: 'https://www.zara.com/ru/', method: "GET" });
//     console.log(`Response ${response.status} get from ${proxyAddress}. Data length is ${response.data.length}`)
// }

// for (let index = 0; index < 100; index++) {
//     await test()
// }

// process.exit(0)


const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://chromium:3000?timeout=120000',
    defaultViewport: { height: 1080, width: 1920 }
});

const page = await browser.newPage();
try {
    await page.setRequestInterception(true);

    page.on('request', async (interceptedRequest) => {

        if (interceptedRequest.url().startsWith("data:")) {
            return await interceptedRequest.continue()
        }
        try {
            const config = {
                url: interceptedRequest.url(),
                method: interceptedRequest.method(),
                data: interceptedRequest.postData(),
                headers: interceptedRequest.headers(),
                responseType: 'arraybuffer'
            }
            const { response: res, proxyAddress } = await getProxiedResponse(config)
            await interceptedRequest.respond({ body: res.data, headers: res.headers, status: res.status, contentType: res.headers["content-type"] });

            console.log(`From ${proxyAddress} get ${interceptedRequest.url()}`);

        } catch (error) {
            console.error(error.message + ' ' + interceptedRequest.url())
            await interceptedRequest.respond({
                body: 'Proxy error',
                headers: { "content-type": "text/plain charset=utf-8" },
                status: 500,
                contentType: "text/plain charset=utf-8"
            }).catch(err => console.error(err));
        }
    });

    const resp = await page.goto('https://www.zara.com/ru/', { waitUntil: "networkidle2", timeout: 120000 });
    console.log(`Result: ${resp?.status()}`)
    try {
        await page.screenshot({ path: "screen.jpg", fullPage: true })
        console.log("Screenshot saved")
    } catch (error) {
        console.error(error)
    }

} catch (error) {
    console.error(error);
} finally {
    await browser.close().catch(err => console.error(err))
}

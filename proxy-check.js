import axios from 'axios';
import { parse } from 'node-html-parser';
import puppeteer from "puppeteer";
import SocksProxyAgent from 'socks-proxy-agent';
import { cwd } from 'fstb'
import {performance} from 'perf_hooks'

const timingMap = new WeakMap()

axios.interceptors.request.use(config => {
    timingMap.set(config, {startTime: performance.now()});
    return config
})

axios.interceptors.response.use((resp) => {
    const store = timingMap.get(resp.config);
    if(store) store.respTime = performance.now() - store.startTime
    return resp
})

const rt = (config) => timingMap.get(config)?Math.floor(timingMap.get(config)?.respTime)+' ms':'-'


const IPPortRegex = /(?<host>^[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}):(?<port>\d{2,5})/

function parseIPPortString(str) {
    const res = IPPortRegex.exec(str)
    return res?.groups
}

async function checkProxySocks(address, type) {
    let result

    const agent = new SocksProxyAgent({ ...parseIPPortString(address), type, timeout: 60000 })

    try {
        const response = await axios.get('https://ya.ru', { httpsAgent: agent, timeout: 60000 });
        const html = parse(response.data)
        const title = html.querySelector('title')?.textContent
        if (title !== 'Яндекс') {
            // await cwd.dump[address + '-' + type + '.html']().asFile().write.txt(response.data);
            throw Error(`Wrong content ${title}`)
        }
        result = `OK(${rt(response.config)}): ${response.status}`
    } catch (error) {
        result = `ERR (): ${error.message}`
    }
    return result
}

const uniqueItems = await cwd.dump['dump.txt']().asFile().read.lineByLineAsync().toArray()

await Promise.all(uniqueItems.map(async address => {
    const s4 = await checkProxySocks(address, 4);
    const s5 = await checkProxySocks(address, 5);
    if (s4.startsWith("OK") || s5.startsWith("OK")) console.log(`${address} - s4:${s4}, s5:${s5}`)
}))

import axios from 'axios';
import { parse } from 'node-html-parser';
import puppeteer from "puppeteer";
import SocksProxyAgent from 'socks-proxy-agent';
import { cwd } from 'fstb'

const IPPortRegex = /(?<host>^[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}):(?<port>\d{2,5})/

function isIPPortString(str) {
  return IPPortRegex.test(str)
}

export const sources = {
  "https://www.socks-proxy.net/": async () => {
    const res = await axios.get('https://www.socks-proxy.net/');
    const html = parse(res.data);
    return html.querySelector("textarea.form-control")
      .innerText
      .split('\n')
      .filter(isIPPortString);
  },
  'https://hidemy.name': async () => {
    const url2 = new URL('https://hidemy.name/ru/proxy-list/?type=4&start=0')
    const proxyList = []
    let count = 0
    while (true) {
      url2.searchParams.set('start', count);
      const res = await axios.get(url2.toString());
      const html = parse(res.data);
      const proxyPageList = html.querySelector('tbody')
        .querySelectorAll('tr')
        .map(tr => tr.querySelectorAll("td")
          .map(td => td.textContent))
        .map(t => `${t[0]}:${t[1]}`)
      count += proxyPageList.length
      // console.log(url2.toString())
      // console.log(proxyPageList)
      if (proxyPageList.length === 0) break;
      proxyList.push(...proxyPageList);
    }
    return proxyList
  },
  'https://spys.one': async () => {
    const browser = await puppeteer.connect({
      browserWSEndpoint: 'ws://chromium:3000?timeout=120000',
      defaultViewport: { height: 1080, width: 1920 }
    });

    const page = await browser.newPage();

    const resp1 = await page.goto('https://spys.one/en/socks-proxy-list/', { waitUntil: "networkidle2", timeout: 120000 });
    if (resp1.status() !== 200) throw Error(`Page return wrong status (${resp1.status()}). Must be 200.`)

    await page.evaluate(() => {
      document.querySelectorAll('#xpp > option')[5].selected = true
      document.querySelector('#xpp').form.submit()
    })

    const resp2 = await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    if (resp1.status() !== 200) throw Error(`Page return wrong status (${resp2.status()}). Must be 200.`)
    const proxyList = await page.evaluate(() => {
      return Array.from(document.body.querySelectorAll('td')).filter(td => td.innerText.length < 25 && /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}/.test(td.innerText)).map(td => td.innerText)
    })

    await page.close()
    browser.disconnect()
    return proxyList
  },
  'http://free-proxy.cz/': async () => {
    const browser = await puppeteer.connect({
      browserWSEndpoint: 'ws://chromium:3000?timeout=120000',
      defaultViewport: { height: 1080, width: 1920 }
    });

    const page = await browser.newPage();

    const resp1 = await page.goto('http://free-proxy.cz/ru/proxylist/country/all/socks/ping/all', { waitUntil: "networkidle2", timeout: 120000 });
    if (resp1.status() !== 200) throw Error(`Page return wrong status (${resp1.status()}). Must be 200.`)

    const result = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#proxy_list >tbody >tr')).filter(tr => tr.children.length > 1).map(tr => `${tr.children[0]?.innerText}:${tr.children[1]?.innerText}`)
    })

    const pagesLinks = await page.evaluate(() => {
      return Array.from(document.querySelector('.paginator').querySelectorAll('a')).map(a => a.href)
    })
    for (const link of new Set(pagesLinks)) {
      await page.goto(link, { waitUntil: "domcontentloaded" })
      const pageResult = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#proxy_list >tbody >tr')).filter(tr => tr.children.length > 1).map(tr => `${tr.children[0]?.innerText}:${tr.children[1]?.innerText}`)
      })
      result.push(...pageResult)
    }
    await page.close()
    browser.close()
    return result
  }
}

export async function extractAllSources() {

  const extractionResult = await Promise.all(Object.entries(sources).map(async ([sourceName, source]) => {
    const result = { sourceName, list: null, error: null }
    try {
      result.list = await source()
    } catch (error) {
      result.error = error
    }
    return result
  }))

  return extractionResult.reduce((acc, sourceResult) => {
    if (sourceResult.list) acc.list.push(...sourceResult.list)
    if (sourceResult.error) acc.errors[sourceResult.sourceName] = sourceResult.error
    return acc
  }, { list: [], errors: {} })

}

async function dump(items) {
  const dumpDir = cwd.dump().asDir()
  if(!await dumpDir.isExists()) await dumpDir.mkdir()
  const dumpFile = dumpDir.fspath['dump.txt']().asFile()
   await dumpFile.unlink()
  await dumpFile.write.txt(items.join('\n'))
}




const proxyList = await extractAllSources()
const uniqueItems = Array.from(new Set(proxyList.list))
await dump(uniqueItems);
console.log(`${uniqueItems.length} dumped to file`)








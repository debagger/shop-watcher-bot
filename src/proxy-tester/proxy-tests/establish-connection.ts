import { ProxyTestResultType, ProxyTestType } from "./proxy-test.type";
import { SocksClient, SocksClientOptions } from 'socks';
import {performance} from 'perf_hooks'
export const establishConnectionTest: ProxyTestType = async function ({ host, port, protocol }): Promise<ProxyTestResultType> {

    const type = protocol

    const options: SocksClientOptions = {
        command: 'connect',
        proxy: { host, port, type },
        destination: { host: '8.8.8.8', port: 53 },
        timeout: 60000
    }

    const res: ProxyTestResultType = {
        name: 'establishConnectionTest',
        host,
        port,
        protocol,
        duration_ms: null
    }
    const start = performance.now()
    try {
        const info = await SocksClient.createConnection(options)
        res.duration_ms = performance.now() - start
        res.okResult = { result: "OK" }
        info.socket.destroy()
    } catch (error) {
        res.duration_ms = performance.now() - start
        res.errorResult = error
    }


    return res
}
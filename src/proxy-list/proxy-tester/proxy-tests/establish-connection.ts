import { ProxyTestResultType, ProxyTestType } from "./proxy-test.type";
import { SocksClient, SocksClientOptions } from 'socks';
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
        protocol
    }

    try {
        const info = await SocksClient.createConnection(options)
        res.okResult = { result: "OK" }
        info.socket.destroy()
    } catch (error) {
        res.errorResult = error
    }


    return res
}
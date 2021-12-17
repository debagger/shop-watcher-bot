export type ProxyTestArgs = { host: string, port: number, protocol: 4 | 5 }

export type ProxyTestResultType = {
    host: string,
    port: number,
    protocol: 4 | 5,
    name: string,
    okResult?: any,
    errorResult?: any,
}

export type ProxyTestType = (args: ProxyTestArgs) => Promise<ProxyTestResultType>
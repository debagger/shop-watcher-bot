export type ProxyTestArgs = { host: string, port: number, protocol: 4 | 5 }

export type ProxyTestResultType = {
    host: string,
    port: number,
    protocol: 4 | 5,
    name: string,
    okResult?: any,
    errorResult?: any,
    duration_ms: number
}

export type ProxyTestType = (args: ProxyTestArgs) => Promise<ProxyTestResultType>
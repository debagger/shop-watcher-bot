import { Axios, AxiosRequestConfig, AxiosResponse,  CancelTokenSource } from "axios";

export type ActiveProxyRequestContext = {
  url: string
  proxyUrl: string
  canceTokenSource: CancelTokenSource
  axiosRequestConfig: AxiosRequestConfig
}

export type BrowseContext = {
    isValidResponse: (response: AxiosResponse) => boolean
    activeRequests: Set<ActiveProxyRequestContext>
    predefinedProxiesAddresses?: string[]
    requestTimeout:number
    proxiesPerRequest:number
  }

export type BrowseArgs = {
    isValidResponse?: (response: AxiosResponse) => boolean
    predefinedProxiesAddresses?: string[]
    incognito?: boolean
    requestTimeout?:number
    proxiesPerRequest?:number
}
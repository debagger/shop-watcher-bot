import { AxiosResponse,  CancelTokenSource } from "axios";
export type BrowseContext = {
    url: string,
    isValidResponse: (response: AxiosResponse) => boolean
    activeRequestCancellers: Set<CancelTokenSource>
  }
  
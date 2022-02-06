export const IPPortRegex =
  /(?<host>^[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}\.[12]?\d{1,2}):(?<port>\d{2,5})/;

export function isIPPortString(str: string) {
  return IPPortRegex.test(str);
}

export function parseIPPortString(str: string) {
  const res = IPPortRegex.exec(str);
  if (!res?.groups) return;
  return { host: res.groups["host"], port: Number(res.groups["port"]) };
}

export type ProxyListExtractionResult = string[];

export type ProxyListExtractor = () => Promise<ProxyListExtractionResult>;

export interface ProxyListSourceExtractorService {
  extract: ProxyListExtractor;
}

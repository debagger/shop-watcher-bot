export interface ChatLinks {
  lastLink?: string;
  [key: string]: SimpleLink| MulticolorLink | string | undefined;
}

export type LinkType = "simpleLink" | "multicolorLink"

export interface LinkBase {
  type: LinkType
}

export interface SimpleLink extends LinkBase {
  type: "simpleLink";
  lastCheckResult?: LinkCheckResultSimple;
  trackFor?: string[];
}

export interface TrackItem {
  color: string
  size: string
}

export interface MulticolorLink extends LinkBase {
  type: "multicolorLink";
  lastCheckResult?: LinkCheckResultMulticolors;
  trackFor?: TrackItem[];
}

export type LinkCheckResultType = "simple" | "multicolors"

export interface LinkCheckResultBase {
  type: LinkCheckResultType
  name: string;
}

export interface LinkCheckResultSimple extends LinkCheckResultBase {
  type: "simple"
  sizes: Size[];
}

export interface Color {
  name: string;
  code: string;
}

export interface LinkCheckResultMulticolors extends LinkCheckResultBase {
  type: "multicolors";
  colors: { color: Color; sizes: Size[] }[]
}

export interface Size {
  size: string;
  disabled: boolean;
}

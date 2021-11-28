export interface ChatLinks {
  lastLink?: string;
  [key: string]: Link | string | undefined;
}


export interface Link {
  lastCheckResult?: LinkCheckResultSimple;
  trackFor?: string[];
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
  name: String;
  code: String;
}

export interface LinkCheckResultMulticolors extends LinkCheckResultBase {
  type: "multicolors";
  colors: { color: Color; sizes: Size[] }[]
}

export interface Size {
  size: string;
  disabled: boolean;
}

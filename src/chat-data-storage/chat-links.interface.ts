export interface ChatLinks {
  lastLink?: string;
  [key: string]:  MulticolorLink | string | undefined;
}

export interface TrackItem {
  color: string
  size: string
}

export interface MulticolorLink {
  lastCheckResult?: LinkCheckResultMulticolors;
  trackFor?: TrackItem[];
}

export interface Color {
  name: string;
  code: string;
}

export interface LinkCheckResultMulticolors {
  name: string;
  colors: { color: Color; sizes: Size[] }[]
}

export interface Size {
  size: string;
  disabled: boolean;
}

export interface ChatLinks {
    lastLink?: string;
    [key: string]: Link | string | undefined;
  }
  
  
  export interface Link {
    lastCheckResult?: LinkCheckResult;
    trackFor?: string[];
  }
  
  export interface LinkCheckResult {
      name: string;
      sizes: Size[];
    }
  
  export interface Size {
    size: string;
    disabled: boolean;
  }
  
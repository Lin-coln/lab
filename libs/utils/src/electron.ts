export type Config = {
  url?: string;
  csp?: Partial<ContentSecurityPolicy>;
};

export type ResolvedConfig = {
  url: string;
  csp: ContentSecurityPolicy;
};

export type ContentSecurityPolicy = {
  "connect-src": string[];
  "img-src": string[];
};

// https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
const keywords = ["self", "none", "unsafe-inline", "unsafe-eval", "strict-dynamic"] as const;
const directives = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "connect-src",
  "font-src",
  "media-src",
  "frame-src",
  "report-uri",
  "upgrade-insecure-requests",
] as const;
type Keyword = (typeof keywords)[number];
type Directive = (typeof directives)[number];
type CSPContent = Partial<Record<Directive, Set<Keyword | string>>>;

export type CSPOptions = Partial<Record<Directive, (Keyword | string)[]>>;

export function applyCSP(head: HTMLRewriterTypes.Element, opts: CSPOptions) {
  const csp = {};

  Object.entries(opts).forEach(([k, v]) => {
    const set = (csp[k] ??= new Set());
    v.forEach((x) => set.add(x));
  });

  const content = toContentString(csp);

  head.append(`  <meta http-equiv="content-security-policy" content="${content}" />\n`, { html: true });
}

function toContentString(csp: CSPContent): string {
  return Object.entries(csp)
    .map(([k, set]) => {
      return `${k} ${Array.from(set)
        .map((x) => (keywords.includes(x as any) ? `'${x}'` : x))
        .join(" ")}`;
    })
    .join("; ");
}

function resolveCSP(content: string): CSPContent {
  const entries = content
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [k, ...rest] = x.split(/\s+/);
      const arr = rest.map((x) => {
        const keyword = x.startsWith(`'`) && x.endsWith(`'`) ? x.slice(1, -1) : null;
        console.log(x, keyword);
        if (keyword && !keywords.includes(keyword as any)) {
          throw new Error(`unknown csp keyword: ${keyword}`);
        }
        return keyword ?? x;
      });
      return [k, arr] as [string, string[]];
    });

  return entries.reduce((acc, [k, cur]) => {
    const set = (acc[k] ??= new Set<string>());
    cur.forEach((x) => set.add(x));
    return acc;
  }, {});
}

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

export function setContentSecurityPolicy(content: Partial<Record<Directive, (Keyword | string)[]>>) {
  let meta = document.head.querySelector(`meta[http-equiv="Content-Security-Policy"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("http-equiv", "Content-Security-Policy");
    document.head.append(meta);
  }
  const csp = resolveCSP(meta.getAttribute("content") ?? "");

  const def = {
    "default-src": ["self"],
    "script-src": ["self"],
    "style-src": ["self"],
    "connect-src": ["self"],
    "img-src": ["self"],
  };
  Object.entries(def).forEach(([k, v]) => {
    const set = (csp[k] ??= new Set());
    v.forEach((x) => set.add(x));
  });

  Object.entries(content).forEach(([k, v]) => {
    const set = (csp[k] ??= new Set());
    v.forEach((x) => set.add(x));
  });

  meta.setAttribute("content", toString(csp));
}

function toString(csp: CSPContent): string {
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

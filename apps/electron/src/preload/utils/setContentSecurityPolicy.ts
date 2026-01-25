// https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
export function setContentSecurityPolicy(content?: string | Record<string, string | string[]>) {
  let meta = document.head.querySelector(`meta[http-equiv="Content-Security-Policy"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("http-equiv", "Content-Security-Policy");
    document.head.append(meta);
  }

  const keys: string[] = ["self", "unsafe-inline"];
  const defaultContent: Record<string, string | string[]> = {
    "default-src": "self",
    "script-src": "self",
    "style-src": "self",
    "connect-src": "self",
    "img-src": "self",
  };
  const convertStrToEntry = (x: string) => {
    const [key, ...items] = x.trim().split(" ");
    const values = items.map((x) => (keys.some((key) => x === `'${key}'`) ? key : x));
    return [key, values] as [string, string[]];
  };
  const convertArrToStr = (x: string[]) => x.map((v) => (keys.includes(v) ? `'${v}'` : v)).join(" ");

  if (!content) content = defaultContent;

  if (typeof content === "string") content = Object.fromEntries(content.split(";").map(convertStrToEntry));

  const contentObject = [...Object.entries(defaultContent), ...Object.entries(content)].reduce(
    (res, [k, v]) => {
      const set = (res[k] ??= new Set());
      void (typeof v === "string" ? [v] : v).forEach((v) => set.add(v));
      return res;
    },
    {} as Record<string, Set<string>>,
  );

  const contentStr = Object.entries(contentObject)
    .map(([key, set]) => `${key} ${convertArrToStr(Array.from(set.values()))}`)
    .join("; ");

  meta.setAttribute("content", contentStr);
}

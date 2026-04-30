import type { Route, RouteMatched, RouteConfig, RouteModule } from "./base";

const EMPTY_PARAMS: Readonly<Record<string, string>> = Object.freeze({});

export function createRouteStore() {
  const routes: Route[] = [];
  const moduleCache = new Map<string, Promise<RouteModule>>();

  return {
    addRoute(config: RouteConfig) {
      if (routes.some((route) => route.path === config.path)) {
        throw new Error(`[router] duplicate path: ${JSON.stringify(config.path)}`);
      }
      const info = resolvePath(config.path);
      const load: () => Promise<RouteModule> =
        "lazy" in config
          ? () => config.lazy()
          : () => Promise.resolve({ Component: (config as unknown as RouteModule).Component });
      const route: Route = {
        path: config.path,
        pattern: info.pattern,
        paramNames: info.paramNames,
        score: info.score,
        load() {
          const module = moduleCache.get(config.path) ?? load();
          moduleCache.set(config.path, module);
          return module;
        },
      };
      routes.push(route);
      routes.sort((a, b) => b.score - a.score);
    },
    match(pathname: `/${string}`): RouteMatched {
      for (const route of routes) {
        const arr = route.pattern.exec(pathname);
        if (!arr) continue;
        const params = decodeParams(route, arr.slice(1));
        const module = route.load();
        return { pathname, params, path: route.path, module };
      }
      return { pathname, params: EMPTY_PARAMS, path: null };
    },
  };

  function decodeParams(route: Route, arr: string[]): Readonly<Record<string, string>> {
    const params: Record<string, string> = {};
    for (let i = 0; i < route.paramNames.length; i++) {
      const raw = arr[i] ?? "";
      try {
        params[route.paramNames[i]!] = decodeURIComponent(raw);
      } catch {
        // 非法编码（如孤立的 "%"）保持原值，避免抛错让整个路由匹配失败。
        params[route.paramNames[i]!] = raw;
      }
    }
    return Object.freeze(params);
  }
}

function resolvePath(path: `/${string}`): { pattern: RegExp; paramNames: string[]; score: number } {
  path = checkPath(path, "pattern");
  const segments = path
    .slice(1)
    .split("/")
    .filter((s) => s !== "");
  const paramNames: string[] = [];
  const seenParams = new Set<string>();
  let score = 0;
  let body = "";

  for (let i = 0; i < segments.length; i++) {
    const info = resolveParam(segments[i]!, i === segments.length - 1);
    if (info.kind === "param") {
      if (seenParams.has(info.name)) {
        throw new Error(`[router] duplicate param name "${info.name}" in path ${JSON.stringify(path)}`);
      }
      seenParams.add(info.name);
      paramNames.push(info.name);
    } else if (info.kind === "wildcard") {
      paramNames.push(info.name);
    }
    body += info.body;
    score += info.score;
  }

  // segments.length === 0 时 body 为空，对应根路径 "/"。
  const pattern = new RegExp(`^${body || "/"}$`);
  return { pattern, paramNames, score };
}

function resolveParam(
  seg: string,
  isLast: boolean,
): { kind: "static" | "param" | "wildcard"; name: string; body: string; score: number } {
  if (seg.startsWith(":")) {
    const name = seg.slice(1);
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(
        `[router] invalid param name in segment ${JSON.stringify(seg)} (must match [a-zA-Z_][a-zA-Z0-9_]*)`,
      );
    }
    return { kind: "param", name, body: "/([^/]+)", score: 4 };
  }
  if (seg === "*") {
    if (!isLast) {
      throw new Error(`[router] "*" must be the last segment, got ${JSON.stringify(seg)}`);
    }
    // 通配是兜底，分值给负让 "/" 也能优先于 "/*"。
    return { kind: "wildcard", name: "*", body: "/(.*)", score: -1 };
  }
  if (/[:*]/.test(seg)) {
    throw new Error(`[router] ":" and "*" must occupy a whole segment, got segment ${JSON.stringify(seg)}`);
  }

  return { kind: "static", name: "", body: "/" + escapeRegex(seg), score: 10 };

  function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

export function checkPath(path: string, kind: "url" | "pattern"): `/${string}` {
  if (typeof path !== "string" || path === "") {
    throw new Error(`[router] path must be a non-empty string, got ${JSON.stringify(path)}`);
  }
  if (!path.startsWith("/")) {
    throw new Error(`[router] path must start with "/", got ${JSON.stringify(path)}`);
  }
  if (/[?#\s]/.test(path)) {
    throw new Error(`[router] path must not contain "?", "#", or whitespace, got ${JSON.stringify(path)}`);
  }
  if (path.length > 1 && path.endsWith("/")) {
    throw new Error(`[router] path must not end with "/" (except root), got ${JSON.stringify(path)}`);
  }
  if (kind === "url" && /[:*]/.test(path)) {
    throw new Error(`[router] path must not contain ":" or "*", got ${JSON.stringify(path)}`);
  }
  return path as `/${string}`;
}

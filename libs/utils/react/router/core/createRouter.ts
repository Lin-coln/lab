import type { RouteConfig, RouteMatched } from "./base";
import { checkPath, createRouteStore } from "./createRouteStore";
import { createHub } from "./createHub";

export type Router = {
  readonly mode: "hash" | "history";
  addRoute(route: RouteConfig): void;
  navigate(opts: { pathname: `/${string}`; replace?: boolean }): void;
  subscribe: (listener: () => void) => () => void;
  resolvePathname: () => `/${string}`;
  resolveRouteMatched: () => RouteMatched;
  resolveParams: () => RouteMatched["params"];
};

export function createRouter(opts: { mode: "hash" | "history"; routes?: RouteConfig[] }): Router {
  const mode = opts.mode;
  const hub = createHub();
  const store = createRouteStore();

  // 上一次匹配的缓存：仅当 pathname 变化时重算，保证 useSyncExternalStore 的引用稳定。
  let matched: RouteMatched | null = null;

  for (const route of opts.routes ?? []) addRoute(route);

  return {
    mode,
    addRoute,
    subscribe: hub.subscribe.bind(hub),
    resolvePathname,
    resolveRouteMatched,
    resolveParams: () => resolveRouteMatched().params,
    navigate(opts) {
      const pathname = checkPath(opts.pathname, "url");
      const replace = opts.replace ?? false;
      // 相同 path 直接跳过，避免历史栈污染。
      if (pathname === resolvePathname()) return;
      applyNavigation({ pathname, replace, mode });
      hub.notify();
    },
  };

  function addRoute(route: RouteConfig) {
    store.addRoute(route);
    matched = null; // 路由表变化，缓存失效
  }

  function resolveRouteMatched(): RouteMatched {
    const pathname = resolvePathname();
    if (!matched || matched.pathname !== pathname) {
      matched = store.match(pathname);
    }
    return matched;
  }

  function resolvePathname(): `/${string}` {
    if (mode === "history") return window.location.pathname as `/${string}`;

    const hashPath = window.location.hash.slice(1) || "";
    if (hashPath.startsWith("/")) return hashPath as `/${string}`;

    return "/";
  }
}

function applyNavigation(opts: { pathname: `/${string}`; replace: boolean; mode: "hash" | "history" }) {
  const { pathname, replace, mode } = opts;
  const url = mode === "history" ? pathname : `${window.location.pathname}${window.location.search}#${pathname}`;
  if (replace) {
    window.history.replaceState({}, "", url);
  } else {
    window.history.pushState({}, "", url);
  }
}

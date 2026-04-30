import { createContext, type ReactNode, use, useSyncExternalStore } from "react";
import type { Router } from "./core";
import type { RouteMatched } from "./core/base";

const RouterContext = createContext<Router | null>(null);

export function RouterProvider(props: { router: Router; children: ReactNode }) {
  return <RouterContext value={props.router}>{props.children}</RouterContext>;
}

export function useRouter(): Router {
  const router = use(RouterContext);
  if (router === null) {
    throw new Error("[router] useRouter must be used within <RouterProvider>");
  }
  return router;
}

export function usePathname() {
  const router = useRouter();
  return useSyncExternalStore(router.subscribe, router.resolvePathname);
}

export function useRouteMatched(): RouteMatched {
  const router = useRouter();
  return useSyncExternalStore(router.subscribe, router.resolveRouteMatched);
}

export function useParams() {
  const router = useRouter();
  return useSyncExternalStore(router.subscribe, router.resolveParams);
}

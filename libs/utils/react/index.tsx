import { useEffect, type ComponentType, type LazyExoticComponent, useState, Suspense } from "react";

type Route = LazyExoticComponent<ComponentType<any>> | ComponentType<any>;

export function useRouter({ mode, getRoute }: { mode: "hash" | "history"; getRoute: (name: string) => Route | void }) {
  const getRouteName = mode === "hash" ? resolveRouteNameFromHash : resolveRouteNameFromPath;

  const [routeName, setRouteName] = useState<string>(getRouteName);

  useEffect(() => {
    const update = () => setRouteName(getRouteName());

    if (mode === "hash") {
      window.addEventListener("hashchange", update);
      return () => window.removeEventListener("hashchange", update);
    }

    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [mode]);

  const RouteComponent = getRoute(routeName);

  return (
    <Suspense fallback={<div>Loading...</div>}>{RouteComponent ? <RouteComponent /> : <h1>404 Not Found</h1>}</Suspense>
  );
}

function resolveRouteNameFromHash() {
  const hash = window.location.hash.slice(1);
  return hash ? "/" + hash : "/";
}

function resolveRouteNameFromPath() {
  const path = window.location.pathname;
  return path || "/";
}

import { lazy, useEffect, useState } from "react";

export const routes = {
  "/": lazy(() => import("./Home")),
  "/sign_in": lazy(() => import("./SignIn")),
  "/profile": lazy(() => import("./Profile")),
} as const;

export function pushRoute(route: keyof typeof routes) {
  window.location.hash = `#${route}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState<string>(window.location.hash.slice(1));

  useEffect(() => {
    if (!route) pushRoute("/");
  }, [route]);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash.slice(1));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}

import { type RouterTypes } from "bun";

type Route = RouterTypes.RouteHandlerObject<string> & {
  readonly NAME: "" | `/${string}`;
  readonly NESTED?: Route[];
};

export function toRouteEntries({
  prefix,
  route,
}: {
  prefix: string;
  route: Route;
}): [string, RouterTypes.RouteHandlerObject<string>][] {
  const { NAME, NESTED = [], ...handlers } = route;

  const routeName = prefix + NAME;
  const nestedPrefix = routeName;
  const nestedEntries = NESTED.map((route) => toRouteEntries({ prefix: nestedPrefix, route })).flat(1);

  if (!routeName.length) return nestedEntries;
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
  if (!Object.keys(handlers).some((key) => methods.includes(key))) return nestedEntries;

  return [...nestedEntries, [routeName, handlers]];
}

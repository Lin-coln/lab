import type { FunctionComponent } from "react";

export type RouteComponent = FunctionComponent;

export type RouteConfig = {
  path: `/${string}`;
} & (RouteModule | { lazy: () => Promise<RouteModule> });

export type RouteModule = {
  readonly Component: RouteComponent;
  // readonly loader?: () => object | Promise<object>; // todo
};

export type Route = {
  path: `/${string}`;
  pattern: RegExp;
  paramNames: string[];
  score: number;
  load: () => Promise<RouteModule>;
};

export type RouteMatched = {
  pathname: `/${string}`;
  params: Readonly<Record<string, string>>;
} & (
  | { path: null } // no match
  | { path: `/${string}`; module: Promise<RouteModule> }
);

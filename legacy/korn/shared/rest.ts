export {};

declare global {
  namespace RestAPI {
    export type RouteBase = {
      readonly name: string;
      readonly query?: Record<string, any>;
      readonly body?: Record<string, any>;
      readonly get?: any;
      readonly post?: any;
    };
    export type Route<R extends RouteBase> = R;

    // parent
    export type RouteParentBase = {
      readonly name: string;
      readonly children: (RouteBase | RouteParentBase)[];
    };
    export type RouteParent<R extends RouteParentBase> = R;
  }

  // namespace RestAPI {
  //   export type Context<R extends RouteBase> = {
  //     readonly req: BunRequest;
  //     readonly query: () => R["query"];
  //     readonly body: () => Promise<R["body"]>;
  //   };
  //   export type HandleGet<R extends RouteBase> = (ctx: Context<R>) => R["get"] | Promise<R["get"]>;
  //   export type HandlePost<R extends RouteBase> = (ctx: Context<R>) => R["post"] | Promise<R["post"]>;
  // }

  // temp tools
  namespace RestAPI {
    // ToRoutes
    type Rename<R extends RouteBase, N extends string> = Route<{
      [K in keyof R]: K extends "name" ? N : R[K];
    }>;
    type Prefixed<P extends RouteBase["name"], R extends RouteBase | RouteParentBase> = R extends RouteParentBase
      ? ToRoutes<{ name: P; children: ToRoutes<R> }>
      : [Rename<R, `${P}/${R["name"]}`>];
    export type ToRoutes<T extends RouteParentBase> = T["children"] extends [infer R, ...infer Rest]
      ? R extends RouteBase | RouteParentBase
        ? [
            ...Prefixed<T["name"], R>,
            ...ToRoutes<{
              name: T["name"];
              children: Rest extends (RouteBase | RouteParentBase)[] ? Rest : [];
            }>,
          ]
        : []
      : [];

    // RouteByName
    export type RouteByName<
      Routes extends RouteBase[],
      Name extends Routes[number]["name"],
    > = Routes[number] extends infer R ? (R extends { name: Name } ? R : never) : never;
  }

  // request
  namespace RestAPI {
    type Option<R extends RouteBase> = {
      [K in keyof R as K extends "name" // name
        ? "name"
        : K extends "query" // query
          ? "query"
          : K extends "body" // body
            ? "body"
            : never]: R[K];
    };

    export type RouteRequest<R extends RouteBase> = {
      name: R["name"];
    } & Partial<Option<R>> &
      Omit<RequestInit, keyof Option<R>>;
  }
}

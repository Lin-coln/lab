import type { AnyFn } from "./type.ts";
import type { PresetContext, InvokeAPI, ProxyAPI, ProxyFns } from "..";

export function createProxy<Extra extends Record<string, any> = {}, Invokes extends ProxyFns<Extra> = ProxyFns<Extra>>(
  ctx: PresetContext & InvokeAPI,
  extra: Extra,
) {
  return create$proxy(ctx, extra) as ProxyAPI<Extra, Invokes>;
}

function create$proxy(ctx: PresetContext & InvokeAPI, extra: object) {
  const { proxy, revoke } = Proxy.revocable(extra as any, {
    get(tar, prop) {
      const got = Reflect.get(tar, prop);
      if (got) return got;

      // todo remove - promise polyfill issue
      if ((["then"] as (string | symbol)[]).includes(prop)) return void 0;

      // todo validate prop
      // prop of Invokes
      return (...args: any[]) => (ctx.invoke as AnyFn)(prop, ...args);
    },
  });

  ctx.onDispose(() => revoke());

  return proxy;
}

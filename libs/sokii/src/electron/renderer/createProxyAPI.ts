import type { InvokeAPI, ProxyAPI, ProxyFns, PresetContext } from "../..";
import { createInvokeAPI } from "./createInvokeAPI.ts";
import { createProxy } from "../../shared/proxy.ts";

type Extra<Invokes extends ProxyFns = ProxyFns, Handles extends ProxyFns = Invokes> = Pick<
  PresetContext & InvokeAPI<Invokes, Handles>,
  "handle" | "dispose"
>;

export function createProxyAPI<Invokes extends ProxyFns = ProxyFns, Handles extends ProxyFns = Invokes>(): ProxyAPI<
  Extra<Invokes, Handles>,
  Invokes
> {
  return (
    createInvokeAPI<Invokes, Handles>()
      // create
      .create((ctx) =>
        createProxy<Extra<Invokes, Handles>, Invokes>(ctx, {
          handle: ctx.handle,
          dispose: ctx.dispose,
        }),
      )
  );
}

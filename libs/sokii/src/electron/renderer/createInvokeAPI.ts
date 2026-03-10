import { createAPI, type InvokeAPI, type AnyFns } from "../..";
import { ipcRenderer } from "electron";
import type { AnyFn } from "../../shared/type.ts";
import { generateResponse } from "../../shared/invoke.ts";

export function createInvokeAPI<Invokes extends AnyFns = AnyFns, Handles extends AnyFns = Invokes>() {
  const channel = `@sokii/invoke`;

  return createAPI.pipe((ctx) => {
    const handlers: Map<string, AnyFn> = new Map();

    ipcRenderer.on(channel, async (_evt, id, name, ...args) => {
      const { data, error } = await resolve(name, ...args);
      ipcRenderer.send(channel + "/response", id, data, error);
    });

    ctx.onDispose(() => {
      handlers.clear();
    });

    return ctx.merged(ctx, {
      invoke,
      handle,
    } as InvokeAPI<Invokes, Handles>);

    // invoke
    function invoke(name: string, ...args: any[]) {
      return ipcRenderer.invoke(channel, name, ...args);
    }

    // handle
    function handle(name: string, handler: AnyFn): () => void {
      if (handlers.has(name)) throw new Error(`Handler has already been registered - ${name}`);
      handlers.set(name, handler);
      return (): void => void handlers.delete(name);
    }
    function resolve(name: string, ...args: any[]) {
      const handler = handlers.get(name);
      if (!handler) throw new Error(`handler not found - ${name}`);
      return generateResponse(() => handler(...args));
    }
  });
}

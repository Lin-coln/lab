import type { PresetContext, InvokeAPI, MessageAPI, AnyFns } from "..";
import { createMessageAPI } from "./createMessageAPI.ts";
import type { AnyFn, HandlersMap } from "../shared/type.ts";
import { generateResponse, uuid } from "../shared/invoke.ts";

type MessageForInvoke = {
  invoke(type: "invoke", id: string, name: string, args: any[]): void;
  response(type: "response", id: string, data: any, error: any): void;
};

export function createInvokeAPI<Invokes extends AnyFns = AnyFns, Handles extends AnyFns = Invokes>(worker: Worker) {
  return createMessageAPI<MessageForInvoke>(worker).pipe((ctx) => {
    const { postMessage, onReceiveMessage, ..._ctx } = ctx;
    return ctx.merged(_ctx as PresetContext, create$invoke(ctx, worker) as InvokeAPI<Invokes, Handles>);
  });
}

interface Ref {
  id: string;
  resolve: (data: any) => any;
  reject: (reason: any) => any;
}

// const NOOP = () => void 0;
const NOOP = void 0 as any; // todo: coverage issue

function create$invoke(ctx: PresetContext & MessageAPI<MessageForInvoke>, worker: Worker) {
  let active: boolean = true;
  const refs: Map<string, Ref> = new Map();
  const handlers: Map<string, AnyFn> = new Map();

  ctx.onReceiveMessage(async (...params) => {
    const type = params[0];
    // invoke
    if (type === "invoke") {
      const [_, id, name, args] = params;
      const { data, error } = await resolve(name, ...args);
      ctx.postMessage("response", id, data, error);
    }
    // response
    else if (type === "response") {
      const [_, id, data, error] = params;
      receive(id, data, error);
    }
  });

  ctx.onDispose(() => {
    active = false;
    refs.clear();
    handlers.clear();
  });

  return {
    invoke,
    handle,
  };

  // invoke
  function invoke(name: string, ...args: any[]) {
    if (!active) throw new Error("InvokeAPI is disposed");
    const ref: Ref = {
      id: uuid(),
      resolve: NOOP,
      reject: NOOP,
    };
    const promise = new Promise<any>((resolve, reject) => {
      ref.resolve = resolve;
      ref.reject = reject;
      ctx.postMessage("invoke", ref.id, name, args);
    });
    refs.set(ref.id, ref);
    return promise;
  }
  function receive(id: string, data: any, error: any) {
    const ref = refs.get(id);
    if (!ref) throw new Error(`ref not found - ${id}`);
    refs.delete(id);
    error ? ref.reject(error) : ref.resolve(data);
  }

  // handle
  function handle(name: string, handler: AnyFn): () => void;
  function handle(handlers: HandlersMap<AnyFns>): () => void;
  function handle(nameOrHandlers: HandlersMap<AnyFns> | string, handler?: AnyFn): () => void {
    if (typeof nameOrHandlers === "string") {
      return handle({ [nameOrHandlers]: handler! });
    }
    const off = Object.entries(nameOrHandlers)
      .filter(([_, handler]) => !!handler)
      .map(([name, handler]) => {
        if (!active) throw new Error("InvokeAPI is disposed");
        if (handlers.has(name)) throw new Error(`Handler has already been registered - ${name}`);
        handlers.set(name, handler);
        return (): void => void handlers.delete(name);
      });
    return () => off.forEach((fn) => fn());
  }

  function resolve(name: string, ...args: any[]) {
    const handler = handlers.get(name);
    return generateResponse(() => {
      if (!handler) throw new Error(`handler not found - ${name}`);
      return handler(...args);
    });
  }
}

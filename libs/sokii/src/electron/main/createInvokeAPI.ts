import { createAPI, type InvokeAPI, type AnyFns } from "../..";
import { webContents, ipcMain, type IpcMainEvent } from "electron";
import type { AnyFn } from "../../shared/type.ts";
import { uuid } from "../../shared/invoke.ts";

interface Ref {
  id: string;
  resolve: (data: any) => any;
  reject: (reason: any) => any;
}
const NOOP = () => void 0;

export function createInvokeAPI<Invokes extends AnyFns = AnyFns, Handles extends AnyFns = Invokes>(id: number) {
  const channel = `@sokii/invoke`;

  const wc = webContents.fromId(id)!;
  if (!wc) throw new Error(`webContents not found`);

  return createAPI.pipe((ctx) => {
    const refs: Map<string, Ref> = new Map();

    ipcMain.on(channel + "/response", handleResponse);
    ctx.onDispose(() => {
      refs.clear();
      ipcMain.off(channel + "/response", handleResponse);
    });

    return ctx.merged(ctx, {
      invoke,
      handle,
    } as InvokeAPI<Invokes, Handles>);

    // invoke
    function invoke(name: string, ...args: any[]) {
      const ref: Ref = {
        id: uuid(),
        resolve: NOOP,
        reject: NOOP,
      };
      const promise = new Promise<any>((resolve, reject) => {
        ref.resolve = resolve;
        ref.reject = reject;
        wc.send(channel, id, name, ...args);
      });
      refs.set(ref.id, ref);
      return promise;
    }
    function handleResponse(evt: IpcMainEvent, ...args: any[]) {
      const [id, data, error] = args;
      receive(id, data, error);
    }
    function receive(id: string, data: any, error: any) {
      const ref = refs.get(id);
      if (!ref) throw new Error(`ref not found - ${id}`);
      refs.delete(id);
      error ? ref.reject(error) : ref.resolve(data);
    }

    // handle
    function handle(name: string, handler: AnyFn) {
      // todo handle wrapper
      ipcMain.handle(name, handler);
      return () => void ipcMain.removeHandler(name);
    }
  });
}

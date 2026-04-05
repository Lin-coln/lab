import { ipcMain, webContents, type IpcMainInvokeEvent, type IpcMainEvent } from "electron";
import { type InvokeRendererChannels, uuid } from "./common";
import { type Args, type IpcChannels, type Promised, type Return, typed } from "./typed-ipc";

export type IpcMain<Channels extends IpcChannels> = ReturnType<typeof createIpcMain<Channels>>;
export function createIpcMain<Channels extends IpcChannels>(namespace: string) {
  type Channel = Extract<keyof Channels, string>;

  const invokeRendererAPI = createInvokeRendererAPI<Channels>(namespace);
  return {
    handle,
    // on(channel, listener): this
    // off(channel, listener): boolean
    ...invokeRendererAPI,
  };

  function handle<T extends Channel>(
    channel: T,
    handle: (event: IpcMainInvokeEvent, ...args: Args<Channels[T]>) => Promised<Channels[T] | Return<Channels[T]>>,
  ): () => void {
    ipcMain.handle(`${namespace}/${channel}`, handle);
    ipcMain.handle(`${namespace}/${channel}`, (evt) => {
      const wc = webContents.fromId(evt.sender.id)!;
    });
    return () => ipcMain.removeHandler(`${namespace}/${channel}`);
  }
}

function createInvokeRendererAPI<Channels extends IpcChannels>(namespace: string) {
  type Channel = Extract<keyof Channels, string>;

  const reqs: Record<string, { id: string; resolve(ret: any): void; reject(reason: any): void }> = {};
  const invoke$ipc = typed.ipcMain<InvokeRendererChannels>(ipcMain);
  invoke$ipc.on("@invoke-renderer/response", (event, { id, result, error }) => {
    const req = reqs[id];
    if (!req) return;
    delete reqs[id];
    error ? req.reject(error) : req.resolve(result);
  });

  return {
    invoke,
  };

  function invoke<T extends Channel>(dest: number, channel: T, ...args: Args<Channels[T]>[]): Promised<Channels[T]> {
    const wc = webContents.fromId(dest);
    if (!wc) throw new Error(`webContents not found - ${dest}`);
    const invoke$wc = typed.webContents<InvokeRendererChannels>(wc);
    const id = uuid();
    const req = { id } as any;
    const promise = new Promise<any>((resolve, reject) => {
      req.resolve = resolve;
      req.reject = reject;
    });
    reqs[id] = req;
    invoke$wc.send("@invoke-renderer/request", { id, channel: `${namespace}/${channel}`, args });
    return promise;
  }
}

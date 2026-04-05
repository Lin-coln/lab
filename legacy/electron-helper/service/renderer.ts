import { ipcRenderer } from "electron";
import type { InvokeRendererChannels } from "./common";
import { type Args, type IpcChannels, type Promised, type Return, typed } from "./typed-ipc";

export type IpcRenderer<Channels extends IpcChannels> = ReturnType<typeof createIpcRenderer<Channels>>;
export function createIpcRenderer<Channels extends IpcChannels>(namespace: string) {
  type Channel = Extract<keyof Channels, string>;

  const invokeRendererAPI = createInvokeRendererAPI<Channels>(namespace);

  return {
    invoke,
    // on(channel, listener): this;
    // execute(channel, ...args): any;
    ...invokeRendererAPI,
  };

  function invoke<T extends Channel>(channel: T, ...args: Args<Channels[T]>): Promised<Channels[T]> {
    return ipcRenderer.invoke(`${namespace}/${channel}`, ...args);
  }
}

function createInvokeRendererAPI<Channels extends IpcChannels>(namespace: string) {
  type Channel = Extract<keyof Channels, string>;

  const handlers: Record<string, (...args: any[]) => any> = {};
  const invoke$ipc = typed.ipcRenderer<InvokeRendererChannels>(ipcRenderer);

  invoke$ipc.on("@invoke-renderer/request", async (event, { id, channel, args }) => {
    if (!channel.startsWith(`${namespace}/`)) return;
    const key = channel.slice(namespace.length + 1);
    try {
      const handler = handlers[key];
      if (!handler) throw new Error(`failed to invoke - ${channel}`);

      const result = await handler(...args);
      invoke$ipc.send("@invoke-renderer/response", { id, result, error: null });
    } catch (err: any) {
      const error = typeof err === "string" ? err : typeof err === "object" && "message" in err ? err.message : err;
      invoke$ipc.send("@invoke-renderer/response", { id, result: null, error });
    }
  });

  return {
    handle,
  };

  function handle<T extends Channel>(
    channel: T,
    handler: (...args: Args<Channels[T]>) => Promised<Channels[T] | Return<Channels[T]>>,
  ): () => void {
    if (handlers[channel]) throw new Error(`failed to set handler`);
    handlers[channel] = handler;
    return () => delete handlers[channel];
  }
}

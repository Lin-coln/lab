import { createAPI, type MessageAPI, type AnyFns } from "../..";
import { ipcRenderer, type IpcRendererEvent } from "electron";

export function createMessageAPI<API extends AnyFns = AnyFns>() {
  const channel = "@sokii/message";
  return createAPI.pipe((ctx) => {
    const listeners: Set<(...args: any[]) => void> = new Set();
    ipcRenderer.on(channel, handleReceive);

    ctx.onDispose(() => {
      listeners.clear();
      ipcRenderer.off("message", handleReceive);
    });

    return ctx.merged(ctx, {
      postMessage,
      onReceiveMessage,
    } as MessageAPI<API>);

    function handleReceive(evt: IpcRendererEvent, ...args: any[]) {
      listeners.forEach((listener) => listener(...args));
    }

    function postMessage(...args: any[]) {
      ipcRenderer.send(channel, ...args);
    }

    function onReceiveMessage(listener: (...args: any[]) => void): () => void {
      listeners.add(listener);
      return (): void => void listeners.delete(listener);
    }
  });
}

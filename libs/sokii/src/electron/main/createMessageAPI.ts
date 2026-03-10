import { createAPI, type MessageAPI, type AnyFns } from "../..";
import { ipcMain, webContents, type IpcMainEvent } from "electron";

export function createMessageAPI<API extends AnyFns = AnyFns>(id: number) {
  const channel = "@sokii/message";

  const wc = webContents.fromId(id)!;
  if (!wc) throw new Error(`webContents not found`);

  return createAPI.pipe((ctx) => {
    const listeners: Set<(...args: any[]) => void> = new Set();
    ipcMain.on(channel, handleReceive);

    ctx.onDispose(() => {
      listeners.clear();
      ipcMain.off(channel, handleReceive);
    });

    return ctx.merged(ctx, {
      postMessage,
      onReceiveMessage,
    } as MessageAPI<API>);

    function handleReceive(evt: IpcMainEvent, ...args: any[]) {
      listeners.forEach((listener) => listener(...args));
    }

    function postMessage(...args: any[]) {
      wc.send(channel, ...args);
    }

    function onReceiveMessage(listener: (...args: any[]) => void): () => void {
      listeners.add(listener);
      return (): void => void listeners.delete(listener);
    }
  });
}

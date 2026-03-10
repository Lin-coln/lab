import type { IpcMainEvent, IpcMainInvokeEvent, IpcRendererEvent } from "electron";

export const typed = {
  ipcMain<Channels extends IpcChannels = IpcChannels>(ipcMain: any): TypedIpcMain<Channels> {
    return ipcMain;
  },
  webContents<Channels extends IpcChannels = IpcChannels>(webContents: any): TypedWebContents<Channels> {
    return webContents;
  },
  ipcRenderer<Channels extends IpcChannels = IpcChannels>(ipcRenderer: any): TypedIpcRenderer<Channels> {
    return ipcRenderer;
  },
};

export type IpcChannels = {
  [channel: string]: (...args: any[]) => any;
};

export type Args<Fn extends (...args: any[]) => any> = Parameters<Fn>;
export type Return<Fn extends (...args: any[]) => any> = Awaited<ReturnType<Fn>>;
export type Promised<Fn extends (...args: any[]) => any> = Promise<Return<Fn>>;

type inferChannel<Channels> = Extract<keyof Channels, string>;

interface TypedIpcMain<Channels extends IpcChannels> {
  on<T extends inferChannel<Channels>>(
    channel: T,
    listener: (event: IpcMainEvent, ...args: Args<Channels[T]>) => void,
  ): void;
  handle<T extends inferChannel<Channels>>(
    channel: T,
    handle: (event: IpcMainInvokeEvent, ...args: Args<Channels[T]>) => Promised<Channels[T] | Return<Channels[T]>>,
  ): TypedIpcMain<Channels>;
}

interface TypedWebContents<Channels extends IpcChannels> {
  send<T extends inferChannel<Channels>>(channel: T, ...args: Args<Channels[T]>): void;
}

interface TypedIpcRenderer<Channels extends IpcChannels> {
  on<T extends inferChannel<Channels>>(
    channel: T,
    listener: (event: IpcRendererEvent, ...args: Args<Channels[T]>) => void,
  ): TypedIpcRenderer<Channels>;
  send<T extends inferChannel<Channels>>(channel: T, ...args: Args<Channels[T]>): void;
}

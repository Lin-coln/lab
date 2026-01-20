import type { BrowserWindow } from "electron";
import { INDEX_FILENAME, toDevURL } from "./constants.ts";
import { win, wc } from "@/helpers";

let mainWin!: BrowserWindow;

export function createMainWindow() {
  mainWin = win.create({
    title: "Main Window",
    show: false,
  });
  mainWin.once("closed", () => {
    mainWin = void 0 as any;
  });
  // show devTools
  // win.webContents.openDevTools({ mode: "detach" });

  mainWin.webContents.once("did-finish-load", () => {
    mainWin.show();
  });

  const urlOrFilePath = toDevURL("/") ?? INDEX_FILENAME;
  return wc.load(mainWin.webContents, urlOrFilePath);
}

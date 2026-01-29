import type { BrowserWindow } from "electron";
import { win, wc } from "@/helpers";
import { env, INDEX_FILENAME } from "@/constants";

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

  const urlOrFilePath = env("dev") ? "http://localhost:3000" + "/" : INDEX_FILENAME;
  if (!urlOrFilePath) throw new Error("Could not find URL or file path");
  return wc.load(mainWin.webContents, urlOrFilePath);
}

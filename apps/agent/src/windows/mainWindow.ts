import { helpers } from "elpers/win";
import type { BrowserWindow } from "electron";
import { disposeServiceWindow } from "./serviceWindow.ts";
import { INDEX_FILENAME, toDevURL } from "./constants.ts";

let mainWin!: BrowserWindow;

export function createMainWindow() {
  mainWin = helpers.win.create({
    title: "Main Window",
    show: false,
  });
  mainWin.once("closed", () => {
    mainWin = void 0 as any;
  });
  // show devTools
  // win.webContents.openDevTools({ mode: "detach" });

  mainWin.on("closed", () => disposeServiceWindow());

  mainWin.webContents.once("did-finish-load", () => {
    mainWin.show();
  });

  const urlOrFilePath = toDevURL("/") ?? INDEX_FILENAME;
  return helpers.wc.load(mainWin.webContents, urlOrFilePath);
}

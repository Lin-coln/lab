import { type BrowserWindow } from "electron";
import { win, wc } from "@/helpers";
import { INDEX_URL } from "@/constants";

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

  return wc.load(mainWin.webContents, INDEX_URL);
}

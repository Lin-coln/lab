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

  mainWin.webContents.on("did-finish-load", async () => {
    await mainWin.webContents.executeJavaScript(
      [
        // `document.documentElement.dataset.material = ${JSON.stringify(platform("win32") ? "mica" : "vibrancy")}`,
        `document.documentElement.dataset.platform = ${JSON.stringify(process.platform)}`,
      ].join(";\n"),
    );
  });

  mainWin.webContents.once("did-finish-load", () => {
    mainWin.show();
  });

  return wc.load(mainWin.webContents, INDEX_URL, {
    // hash: ''
  });
}

export function disposeMainWindow() {
  if (!mainWin) return;
  win.ensureDisposed(mainWin);
}

function _keepAliveWin(win: BrowserWindow, getCurrentWin: () => BrowserWindow) {
  const isCurWin = () => getCurrentWin() === win;

  const recreateWindow = () => {
    // disposeWindow();
    // void createWindow();
  };

  win.on("close", (event) => {
    if (!isCurWin()) return;
    event.preventDefault();
  });
  win.webContents.on("render-process-gone", (event, details) => {
    if (!isCurWin()) return;
    console.error("⚠️ Service renderer crashed:", details);
    recreateWindow();
  });
  win.webContents.on("unresponsive", () => {
    if (!isCurWin()) return;
    console.warn("⚠️ Service renderer is unresponsive, restarting...");
    recreateWindow();
  });
}

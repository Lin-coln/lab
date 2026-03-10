import { helpers } from "elpers/win";
import type { BrowserWindow } from "electron";
import { INDEX_FILENAME, toDevURL } from "./constants";

let serviceWin!: BrowserWindow;

export function createServiceWindow() {
  serviceWin = helpers.win.create({
    title: "Service Window",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
  });
  serviceWin.once("closed", () => {
    serviceWin = void 0 as any;
  });

  // keep service window
  const win = serviceWin;
  const isCurWin = () => serviceWin === win;
  win.on("close", (event) => {
    if (!isCurWin()) return;
    event.preventDefault();
  });
  win.webContents.on("render-process-gone", (event, details) => {
    if (!isCurWin()) return;
    console.error("⚠️ Service renderer crashed:", details);
    recreateServiceWindow();
  });
  win.webContents.on("unresponsive", () => {
    if (!isCurWin()) return;
    console.warn("⚠️ Service renderer is unresponsive, restarting...");
    recreateServiceWindow();
  });

  const urlOrFilePath = toDevURL("/service") ?? INDEX_FILENAME;
  return helpers.wc.load(serviceWin.webContents, urlOrFilePath);
}

export function disposeServiceWindow() {
  if (!serviceWin) return;
  helpers.win.ensureDisposed(serviceWin);
}

function recreateServiceWindow() {
  disposeServiceWindow();
  void createServiceWindow();
}

import { BrowserWindowHelpers } from "./BrowserWindowHelpers";
import { WebContentsHelpers } from "./WebContentsHelpers";
import path from "node:path";
import { app } from "electron";

export const win = new BrowserWindowHelpers();
export const wc = new WebContentsHelpers();

export async function initializeHelpers() {
  const preload = path.join(app.getAppPath(), "preload/index.js");

  win.setDefaultOptions({
    webPreferences: {
      devTools: true,
      preload,
      additionalArguments: [],
    },
    titleBarStyle: "hidden",
    titleBarOverlay: { color: "#141416", symbolColor: "#f5f5f5", height: 32 },
    transparent: false,
    // frame: false,
    // backgroundMaterial: "mica",
    trafficLightPosition: { x: 18, y: 18 },
  });
}

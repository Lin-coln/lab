import { BrowserWindowHelpers } from "./BrowserWindowHelpers";
import { WebContentsHelpers } from "./WebContentsHelpers";
import path from "node:path";
import { app } from "electron";
import { channel, platform } from "@/constants";

export const win = new BrowserWindowHelpers();
export const wc = new WebContentsHelpers();

export async function initializeHelpers() {
  const preload = path.join(app.getAppPath(), "preload/index.js");

  win.setDefaultOptions({
    webPreferences: {
      preload,
      devTools: channel("internal"),
      additionalArguments: [],
    },
    transparent: false,
    titleBarStyle: platform("darwin") ? "hiddenInset" : "hidden",
    titleBarOverlay: platform("win32")
      ? { color: "#00000000", symbolColor: "#7f7f7f", height: 32 }
      : { color: "#141416", symbolColor: "#f5f5f5", height: 32 },
    ...(process.platform === "win32" ? { backgroundMaterial: "mica" } : {}),
    ...(process.platform === "darwin"
      ? {
          vibrancy: "under-window", // blur
          visualEffectState: "active",
          trafficLightPosition: { x: 18, y: 18 },
        }
      : {}),
  });
}

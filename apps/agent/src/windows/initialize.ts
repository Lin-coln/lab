import { helpers } from "elpers/win";
import { PRELOAD_FILENAME } from "@/windows/constants.ts";

export async function initializeHelpers() {
  helpers.win.setDefaultOptions({
    webPreferences: {
      devTools: true,
      preload: PRELOAD_FILENAME,
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

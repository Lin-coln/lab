import path from "node:path";
import { app } from "electron";
import { type BuildOptions, resolveArgs } from "utils/electron";

const APP_BUILD_OPTIONS = process.env.APP_BUILD_OPTIONS as any;

export const MODE = /* @__PURE__ */ getBuildOptions("mode");
export const PRELOAD_FILENAME = /* @__PURE__ */ (() => path.join(app.getAppPath(), "preload/index.cjs"))();
export const INDEX_FILENAME = /* @__PURE__ */ (() => path.join(app.getAppPath(), "renderer/index.html"))();
export const APP_ARGS = /* @__PURE__ */ (() => resolveArgs<any>(process.argv.slice(2)))();

export function toDevURL(pathname: string = "/") {
  if (MODE !== "dev") throw new Error("Could not find URL or file path");

  const DEV_URL = getBuildOptions("dev_url");
  return DEV_URL + pathname;
}

function getBuildOptions<K extends keyof BuildOptions>(key: K): BuildOptions[K] {
  if (!APP_BUILD_OPTIONS) throw new Error("Could not find build option");
  return APP_BUILD_OPTIONS[key];
}

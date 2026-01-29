import path from "node:path";
import { app } from "electron";
import type { BuildMetaData } from "utils/electron-bun";
// import { resolveArgs } from "utils";

export const PRELOAD_FILENAME = /* @__PURE__ */ (() => path.join(app.getAppPath(), "preload/index.cjs"))();
export const INDEX_FILENAME = /* @__PURE__ */ (() => path.join(app.getAppPath(), "renderer/index.html"))();

// export const APP_ARGS = /* @__PURE__ */ (() => resolveArgs<any>(process.argv.slice(2)))();

export function env<T extends BuildMetaData["env"]>(val: T) {
  return getMetaData("env") === val;
}

export function channel<T extends BuildMetaData["channel"]>(val: T) {
  return getMetaData("channel") === val;
}

function getMetaData<K extends keyof BuildMetaData>(key: K): BuildMetaData[K] {
  const metadata = process.env.APP_BUILD_META_DATA as any;
  if (!metadata) throw new Error("Could not find metadata");
  return metadata[key];
}

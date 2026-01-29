import type { BuildMetaData } from "utils/electron-bun";
import path from "node:path";
import { app } from "electron";
// import { resolveArgs } from "utils";

// export const APP_ARGS = /* @__PURE__ */ (() => resolveArgs<any>(process.argv.slice(2)))();

export const INDEX_URL = /* @__PURE__ */ (() => {
  const url = getMetaData("index_url");
  if (url) return url;
  return path.join(app.getAppPath(), "renderer/index.html");
})();

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

import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
export const toDistPath = (...paths: string[]) => path.resolve(__dirname, "../../dist", ...paths);

export const APP_ARGS: Record<string, string | number | boolean> = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((x) => x.startsWith("--"))
    .map((x) => {
      const [k, v] = x.split("=");
      return [k!.slice(2), v ? JSON.parse(v) : true];
    }),
);

const INDEX_URL = process.env.INDEX_URL;
export const toDevURL = (pathname: string = "/") => (INDEX_URL ? INDEX_URL + pathname : void 0);

export const PRELOAD_FILENAME = toDistPath("preload/index.cjs");
export const INDEX_FILENAME = toDistPath("renderer/index.html");

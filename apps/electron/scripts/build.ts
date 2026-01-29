import path from "node:path";
import { type BuildMetaData, build } from "utils/electron-bun";
import { resolveArgs } from "utils";

const args = resolveArgs<{ env: BuildMetaData["env"] }>(process.argv.slice(2));
args.env ??= "prod";

const rendererDirname = path.resolve(process.cwd(), "..", process.env.RENDERER_PROJECT!);
const rendererConfig = (await import(path.join(rendererDirname, "package.json"))
  .then((x) => x.default.electron)
  .then((x) => (x ? import(path.join(rendererDirname, x)).then((x) => x.default) : {}))
  .then((x) => ({
    url: "http://localhost:3000",
    build: () =>
      Bun.$`
        cd ${rendererDirname}
        bun run build
      `.then(() => path.join(rendererDirname, "dist")),
    ...x,
  }))) as {
  url: string;
  build: () => Promise<string>;
};

const mainScriptFilename = path.join(rendererDirname, "./electron/index.ts");

await build({
  env: args.env,
  channel: "internal",
  version: "0.1.0",
  renderer: {
    url: args.env === "dev" ? rendererConfig.url : void 0,
    build: rendererConfig.build,
  },
});

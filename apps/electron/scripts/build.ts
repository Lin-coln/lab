import path from "node:path";
import { type BuildMetaData, build } from "utils/electron-bun";
import { resolveArgs } from "utils";

const args = resolveArgs<{ env: BuildMetaData["env"] }>(process.argv.slice(2));
args.env ??= "prod";

const rendererDirname = path.resolve(process.cwd(), "..", process.env.RENDERER_PROJECT!);
const mainScriptFilename = path.join(rendererDirname, "./electron/index.ts");

await build({
  env: args.env,
  channel: "internal",
  version: "0.1.0",
  renderer: {
    url: args.env === "dev" ? "http://localhost:3000" : void 0,
    async build() {
      await Bun.$`
        cd ${rendererDirname}
        bun run build
      `;
      return path.join(rendererDirname, "dist");
    },
  },
});

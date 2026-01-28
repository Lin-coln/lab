import fs from "node:fs";
import path from "node:path";
import { createBuildContext, resolveArgs } from "utils/electron";

const args: { mode: "dev" | "build" } = resolveArgs(process.argv.slice(2));
args.mode ??= "build";

// create build context
const ctx = await createBuildContext({
  dist: "dist",
  preload: {
    dist: "preload",
  },
  renderer: {
    dist: "renderer",
    dev_url: "http://localhost:3000",
    async build(ctx) {
      await Bun.$`
        cd ${path.join(process.cwd(), "..", process.env.RENDERER_PROJECT!)}
        bun run build
        mv dist ${ctx.dist.renderer()}
      `;
    },
  },
});

// cleanup
fs.existsSync(ctx.dist()) && (await fs.promises.rm(ctx.dist(), { recursive: true }));
await fs.promises.mkdir(ctx.dist(), { recursive: true });

// build
if (args.mode !== "dev") await ctx.build_renderer();
await ctx.build_preload();
await ctx.build_main(args.mode);
await ctx.generate_package_json();

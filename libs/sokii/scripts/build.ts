import { type BuildConfig, type BuildConfigBase, type BunPlugin } from "bun";
import fs from "node:fs";
import * as path from "node:path";

const dist = path.resolve(import.meta.dir, "../dist");
if (fs.existsSync(dist)) await fs.promises.rm(dist, { recursive: true });

// const name = process.env.SOKII_NAME ?? "sokii"; ...
// console.log("SOKII_NAME", name);

const cfg: BuildConfigBase = {
  outdir: dist,
  entrypoints: [],
  target: "browser",
  format: "esm",
  minify: false,
  sourcemap: "linked",
  plugins: [
    // SokiiAliasPlugin(name)
  ],
};

await build({
  entrypoints: [
    "src/index.ts",
    // worker
    "src/worker/index.ts",
    // // electron
    // "src/electron/renderer/index.ts",
    // "src/electron/main/index.ts",
  ],
  splitting: true,
  external: ["electron"],
});

async function build({ entrypoints, ...buildCfg }: BuildConfig) {
  await Bun.build({
    ...cfg,
    ...buildCfg,
    entrypoints: entrypoints,
    format: "esm",
    naming: {
      entry: `[dir]/[name].js`,
      chunk: "chunks/[name]-[hash].js",
    },
  });
  await Bun.build({
    ...cfg,
    ...buildCfg,
    entrypoints: entrypoints,
    format: "cjs",
    naming: {
      entry: `[dir]/[name].cjs`,
      chunk: "chunks/[name]-[hash].cjs",
    },
  });
}

function SokiiAliasPlugin(name: string): BunPlugin {
  return {
    name: "sokii-alias",
    setup(build) {
      const filter = new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$");

      if (name !== "sokii") {
        build.onLoad({ filter: /\.ts$/ }, async (args) => {
          let source = await Bun.file(args.path).text();
          // replace "sokii" to the <name>
          source = source.replace(/\bfrom\s+["']sokii["']/g, `from "${name}"`);
          return { contents: source, loader: "ts" };
        });
      }

      // external sokii package
      build.onResolve({ filter }, (args) => {
        return { path: args.path, external: true };
      });
    },
  };
}

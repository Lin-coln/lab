import fs from "node:fs";
import tailwind from "bun-plugin-tailwind";
import electronPlugin from "./electronPlugin.ts";

const dist = "dist";
if (fs.existsSync(dist)) await fs.promises.rm(dist, { recursive: true });

await Bun.build({
  entrypoints: ["src/index.html"],
  outdir: dist,
  target: "browser",
  format: "esm",
  sourcemap: "external",
  minify: false,
  plugins: [tailwind, electronPlugin],
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "chunks/[name]-[hash].[ext]",
  },
});

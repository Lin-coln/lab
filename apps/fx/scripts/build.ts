import fs from "node:fs";
import tailwind from "bun-plugin-tailwind";

const dist = "dist";
await fs.promises.rm(dist, { recursive: true, force: true });

await Bun.build({
  entrypoints: ["src/index.html"],
  outdir: dist,
  target: "browser",
  format: "esm",
  sourcemap: "external",
  minify: env("prod"),
  splitting: true,
  plugins: [tailwind],
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "chunks/[name]-[hash].[ext]",
  },
});

function env(env: "prod" | "dev"): boolean {
  return {
    prod: process.env.NODE_ENV === "production",
    dev: process.env.NODE_ENV === "development",
  }[env];
}

import tailwind from "bun-plugin-tailwind";
import fs from "node:fs";
import html from "./bun-plugin-html";

const dist = "dist";
if (fs.existsSync(dist)) await fs.promises.rm(dist, { recursive: true });

await Bun.build({
  entrypoints: ["src/index.html"],
  outdir: dist,
  target: "browser",
  format: "esm",
  sourcemap: "external",
  minify: false,
  plugins: [tailwind, html],
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "chunks/[name]-[hash].[ext]",
  },
});

// csp: {
//   "img-src": [
//     // image
//     "http://p3.music.126.net/",
//     "http://p4.music.126.net/",
//   ],
// },

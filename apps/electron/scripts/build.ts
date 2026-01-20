import fs from "node:fs";
import path from "node:path";

const args: Record<string, string | number | boolean> = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((x) => x.startsWith("--"))
    .map((x) => {
      let [k, v] = x.split("=");
      v ??= "true";
      try {
        v = JSON.parse(v);
      } catch {}
      return [k!.slice(2), v as any];
    }),
);

// cleanup
{
  const dist = "dist";
  if (fs.existsSync(dist)) await fs.promises.rm(dist, { recursive: true });
  await fs.promises.mkdir(dist, { recursive: true });
}

// renderer
if (args.flag !== "dev") {
  const dist = "dist/renderer";
  if (fs.existsSync(dist)) await fs.promises.rm(dist, { recursive: true });

  await Bun.$`
    cd ../view
    bun run build
    mv ./dist ${path.resolve(dist)}
  `;
}

// preload
{
  const dist = "dist/preload";
  if (fs.existsSync(dist)) await fs.promises.rm(dist, { recursive: true });

  await Bun.build({
    entrypoints: ["src/preload/index.ts"],
    outdir: dist,
    target: "browser",
    format: "cjs",
    sourcemap: "external",
    minify: false,
    naming: {
      entry: "[dir]/[name].cjs",
      chunk: "chunks/[name]-[hash].[ext]",
    },
    external: ["electron"],
  });
}

// main
{
  const dist = "dist/main";
  if (fs.existsSync(dist)) await fs.promises.rm(dist, { recursive: true });

  await Bun.build({
    entrypoints: ["src/main.ts"],
    outdir: dist,
    target: "node",
    format: "esm",
    sourcemap: "external",
    minify: false,
    naming: {
      entry: "[dir]/index.js",
      chunk: "chunks/[name]-[hash].[ext]",
    },
    external: ["electron"],
    define: {
      "process.env.INDEX_URL": process.env.INDEX_URL ?? "",
    },
  });
}

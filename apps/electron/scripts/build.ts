import fs from "node:fs";
import path from "node:path";

const args = await resolveArgs(process.argv.slice(2));

const dist = "dist";
fs.existsSync(dist) && (await fs.promises.rm(dist, { recursive: true }));
await fs.promises.mkdir(dist, { recursive: true });

const toDist = (...paths: string[]) => path.join(dist, ...paths);
if (args.flag !== "dev") await buildRenderer({ dirname: "../view" });
await buildPreload();
await buildMain();

async function resolveArgs(args: string[]) {
  return Object.fromEntries(
    args

      .filter((x) => x.startsWith("--"))
      .map((x) => {
        let [k, v] = x.split("=");
        v ??= "true";
        try {
          v = JSON.parse(v);
        } catch {}
        return [k!.slice(2), v as any];
      }),
  ) as Record<string, string | number | boolean>;
}

async function buildRenderer(opts: { dirname: string }) {
  const { dirname } = opts;
  await Bun.$`
    cd ${dirname}
    bun run build
    mv dist ${path.resolve(toDist("dist"))}
  `;
}

async function buildPreload() {
  await Bun.build({
    entrypoints: ["src/preload/index.ts"],
    outdir: toDist("preload"),
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

async function buildMain() {
  await Bun.build({
    entrypoints: ["src/main.ts"],
    outdir: toDist("main"),
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

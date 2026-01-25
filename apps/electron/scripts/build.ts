import fs from "node:fs";
import path from "node:path";
import type { Config } from "utils/electron";

const args = await resolveArgs(process.argv.slice(2));

const toDist = (...paths: string[]) => path.join("dist", ...paths);
const toRenderer = (...paths: string[]) => path.join(process.cwd(), "..", process.env.RENDERER_PROJECT!, ...paths);

const isRendererDev = args.flag === "dev";
const config: Config = await import(toRenderer("package.json"))
  .then((x) => import(toRenderer(x.default.electron)))
  .then((x) => ({
    url: "http://localhost:3000",
    ...x.config,
  }));

// cleanup
fs.existsSync(toDist()) && (await fs.promises.rm(toDist(), { recursive: true }));
await fs.promises.mkdir(toDist(), { recursive: true });

isRendererDev || (await buildRenderer({ dirname: toRenderer() }));
await buildPreload();
await buildMain();
await generatePackageJson();

// methods

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
    mv dist ${path.resolve(toDist("renderer"))}
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
      "process.env.INDEX_URL": isRendererDev ? config.url! : "",
    },
  });
}

async function generatePackageJson() {
  const pkg = await import("../package.json").then((x) => x.default);
  await fs.promises.writeFile(
    toDist("package.json"),
    JSON.stringify(
      {
        name: pkg.name,
        type: pkg.type ?? "module",
        main: "main/index.js",
      },
      null,
      2,
    ),
  );
}

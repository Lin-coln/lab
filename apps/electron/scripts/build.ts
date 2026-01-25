import fs from "node:fs";
import path from "node:path";
import type { ContentSecurityPolicy, ResolvedConfig } from "utils/electron";

const args = await resolveArgs(process.argv.slice(2));

const toDist = (...paths: string[]) => path.join("dist", ...paths);
const toRenderer = (...paths: string[]) => path.join(process.cwd(), "..", process.env.RENDERER_PROJECT!, ...paths);

const isRendererDev = args.flag === "dev";
const config: ResolvedConfig = await import(toRenderer("package.json"))
  .then((x) => (x.default.electron ? import(toRenderer(x.default.electron)) : { config: {} }))
  .then(({ config: cfg }) => ({
    url: "http://localhost:3000",
    ...cfg,
    csp: { "connect-src": [], "img-src": [], ...(cfg.csp ?? {}) },
  }));

// cleanup
fs.existsSync(toDist()) && (await fs.promises.rm(toDist(), { recursive: true }));
await fs.promises.mkdir(toDist(), { recursive: true });

isRendererDev || (await buildRenderer({ dirname: toRenderer() }));
await buildPreload({ csp: config.csp });
await buildMain({ index: isRendererDev ? config.url! : "" });
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

async function buildPreload(opts: { csp: ContentSecurityPolicy }) {
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
    define: {
      "process.env.CSP": JSON.stringify(opts.csp),
    },
  });
}

async function buildMain(opts: { index: string }) {
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
      "process.env.INDEX_URL": opts.index,
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

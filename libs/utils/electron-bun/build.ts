import path from "node:path";
import fs from "node:fs";

export type BuildMetaData = {
  env: "dev" | "prod";
  channel: "internal" | "official";
  version: string;
  index_url?: string;
};

export type BuildConfig = {
  env: BuildMetaData["env"];
  channel: BuildMetaData["channel"];
  version: string;
  entrypoint?: string;
  outdir?: string;
  preload?: { name?: string; entrypoint?: string };
  renderer?: { name?: string; url?: string; build: () => Promise<string> };
};

export async function build(cfg: BuildConfig) {
  const outdir = cfg.outdir ?? "dist/build";
  const { env, channel, version } = cfg;

  const buildMetaData: BuildMetaData = { env, channel, version, index_url: cfg.renderer?.url ?? "" };

  // cleanup
  fs.existsSync(path.resolve(outdir)) && (await fs.promises.rm(path.resolve(outdir), { recursive: true }));
  await fs.promises.mkdir(path.resolve(outdir), { recursive: true });

  // build renderer
  if (env === "prod" && cfg.renderer) {
    const from = await cfg.renderer.build();
    const to = path.resolve(outdir, cfg.renderer.name ?? "renderer");
    await Bun.$`mv ${from} ${to}`;
  }

  // build preload
  await Bun.build({
    entrypoints: [cfg.preload?.entrypoint ?? "src/preload/index.ts"],
    outdir: path.join(outdir, cfg.preload?.name ?? "preload"),
    target: "browser",
    format: "esm",
    sourcemap: "external",
    minify: false,
    naming: {
      entry: "[dir]/[name].js",
      chunk: "chunks/[name]-[hash].[ext]",
    },
    external: ["electron"],
    define: {},
  });

  // build main
  await Bun.build({
    entrypoints: [cfg.entrypoint ?? "src/index.ts"],
    outdir: outdir,
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
      "process.env.APP_BUILD_META_DATA": JSON.stringify(buildMetaData),
    },
    // files: {
    //   "#electron/index.ts": mainScriptFilename ? await fs.promises.readFile(mainScriptFilename) : `export {};`,
    // },
  });

  // generate package json
  const pkg_electron = await import(path.resolve(process.cwd(), "node_modules/electron/package.json")).then(
    (x) => x.default,
  );
  await fs.promises.writeFile(
    path.join(outdir, "package.json"),
    JSON.stringify(
      {
        name: "electron",
        type: "module",
        main: "index.js",
        dependencies: {
          electron: pkg_electron.version,
        },
      },
      null,
      2,
    ),
  );
}

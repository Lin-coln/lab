import fs from "node:fs";
import path from "node:path";

export interface BuildConfig {
  dist: string;
  preload: {
    dist: string;
  };
  renderer: {
    dist: string;
    dev_url: string;
    build: (ctx: BuildContext) => Promise<void>;
  };
}

type BuildMode = "dev" | "build";

export type BuildOptions = {
  mode: BuildMode;
  dev_url: string;
};

export interface BuildContext {
  dist: {
    (...paths: string[]): string;
    preload: (...paths: string[]) => string;
    renderer: (...paths: string[]) => string;
  };
  dev_url: string;
  build_renderer: () => Promise<void>;
  build_preload: () => Promise<void>;
  build_main: (mode: BuildMode) => Promise<void>;
  generate_package_json: () => Promise<void>;
}

export async function createBuildContext(cfg: BuildConfig) {
  const dist: BuildContext["dist"] = Object.assign(
    (...paths: string[]) => path.resolve(process.cwd(), cfg.dist, ...paths),
    {
      preload: (...paths: string[]) => dist(cfg.preload.dist, ...paths),
      renderer: (...paths: string[]) => dist(cfg.renderer.dist, ...paths),
    },
  );

  const ctx: BuildContext = {
    dist,
    dev_url: cfg.renderer.dev_url,
    build_renderer: () => cfg.renderer.build(ctx),
    build_preload: () => buildPreload(ctx),
    build_main: (mode) => buildMain(ctx, mode),
    generate_package_json: () => generatePackageJson(ctx),
  };

  return ctx;
}

async function buildPreload(ctx: BuildContext) {
  await Bun.build({
    entrypoints: ["src/preload/index.ts"],
    outdir: ctx.dist.preload(),
    target: "browser",
    format: "cjs",
    sourcemap: "external",
    minify: false,
    naming: {
      entry: "[dir]/[name].cjs",
      chunk: "chunks/[name]-[hash].[ext]",
    },
    external: ["electron"],
    define: {},
  });
}

async function buildMain(ctx: BuildContext, mode: BuildMode) {
  const buildOptions: BuildOptions = {
    mode,
    dev_url: ctx.dev_url,
  };

  await Bun.build({
    entrypoints: ["src/main.ts"],
    outdir: ctx.dist("main"),
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
      "process.env.APP_BUILD_OPTIONS": JSON.stringify(buildOptions),
    },
  });
}

async function generatePackageJson(ctx: BuildContext) {
  const pkgFilename = path.resolve(process.cwd(), "package.json");
  const pkg = await fs.promises.readFile(pkgFilename, "utf-8").then((x) => JSON.parse(x));
  await fs.promises.writeFile(
    ctx.dist("package.json"),
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

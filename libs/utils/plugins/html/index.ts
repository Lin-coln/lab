import { applyCSP, type CSPOptions } from "./csp.ts";

export function html(opts?: { csp?: CSPOptions }) {
  const csp = opts?.csp ?? null;

  const plugin: Bun.BunPlugin = {
    name: "bun-plugin-html",
    target: "browser",
    setup(build) {
      const rewriter = new HTMLRewriter();

      if (csp) {
        rewriter.on("head", { element: (el) => applyCSP(el, csp) });
      }

      build.onLoad({ filter: /\.html$/ }, async (args) => {
        const html = await Bun.file(args.path).text();
        return {
          loader: "html",
          contents: rewriter.transform(html),
        };
      });
    },
  };

  return plugin;
}

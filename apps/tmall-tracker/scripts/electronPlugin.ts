import type { BunPlugin } from "bun";
import fs from "node:fs";
import { builtinModules } from "node:module";

export default nativeRequirePlugin(["electron", ...builtinModules.map((x) => [x, `node:${x}`]).flat(1)]);

function nativeRequirePlugin(nativeDeps: string[]): BunPlugin {
  const depPattern = nativeDeps.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const req = `window.require`;

  return {
    name: "native-require-plugin",
    setup(build) {
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        let source = await fs.promises.readFile(args.path, "utf8");
        let changed: boolean = false;

        const reg = new RegExp(`import\\s+(.+?)\\s+from\\s+["'](${depPattern})["'];`, "gs");
        while (true) {
          const hasImportStatement = reg.exec(source);
          if (!hasImportStatement) break;

          const statement = hasImportStatement[1]!
            .replace(/\/\/.*?$|\/\*[\s\S]*?\*\//gm, "") // remove comments
            .replaceAll("\n", ""); //  remove \n

          const data = resolveImport(statement) ?? {};

          const dep = hasImportStatement[2]!;
          const idx = hasImportStatement.index;
          const len = hasImportStatement[0]!.length;
          const def = data.def ? `const ${data.def} = ${req}("${dep}");` : null;
          const named = data.named?.length ? `const { ${data.named.join(", ")} } = ${req}("${dep}");` : null;

          if (!def && !named) continue;
          source = source.slice(0, idx) + `${def ?? ""}${named ?? ""}` + source.slice(idx + len);
          changed = true;
        }

        if (!changed) return;

        return {
          contents: source,
          loader: args.path.endsWith("tsx") ? "tsx" : args.path.endsWith("ts") ? "ts" : "js",
        };
      });
    },
  };
}

function resolveImport(statement: string): void | { def?: string; named?: string[] } {
  // import type ... from
  const isTypeImport = /^type\s+{/.test(statement);
  if (isTypeImport) return;

  // import * as $1 from
  const isDefImport = /^\*\s+as\s+(.+)/.exec(statement);
  if (isDefImport) return { def: isDefImport[1]! };

  // import { $1 } from
  const isNamedImport = /^{\s*(.+)\s*}$/.exec(statement);
  if (isNamedImport) {
    const named = resolveNames(isNamedImport[1]!);
    if (named.length) return { named };
    return;
  }

  // import $1, { $2 } from
  const isMixedImport = /^(.+),\s*\{(.+)}$/.exec(statement);
  if (isMixedImport) {
    const def = isMixedImport[1]!;
    const named = resolveNames(isMixedImport[2]!);
    return { def, named };
  }

  throw new Error(`unknown import statement: ${statement}`);
}

function resolveNames(str: string) {
  const items = str
    .split(",")
    .map((x) => x.trim())
    .filter((x) => !!x && !x.startsWith("type "));
  return items.map((item) => {
    // $1 as $2
    const hasAlias = /^(.+)\s+as\s+(.+)$/.exec(item);
    if (hasAlias) return `${hasAlias[1]!}: ${hasAlias[2]!}`;
    return item;
  });
}

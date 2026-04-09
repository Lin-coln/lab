import { Command } from "commander";
import path from "node:path";
import { walkFile } from "@/utils";
import cfg from "@/uxu.local.json";

export default new Command("check").action(async () => {
  await check(process.cwd());
});

export async function check(dirname: string) {
  const items: { basename: string; nextname: string; ext: string }[] = [];
  await walkFile(dirname, (file) => {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const nextName = resolveNextName(basename);
    if (!nextName) return;
    if (nextName === basename) return;
    console.log(nextName, basename);
    items.push({ basename, nextname: nextName, ext });
  });

  return items;
}

function resolveNextName(basename: string) {
  const regex = new RegExp(`(${cfg.prefix.join("|")})-?([0-9a-zA-Z]+)`, "i");

  const match = basename.match(regex);
  if (!match) {
    console.warn(`failed to resolve nextname - ${basename}`);
    return;
  }

  const pre = match[1]!.toUpperCase();
  const suf = match[2]!;
  return `${pre}-${suf}`;
}

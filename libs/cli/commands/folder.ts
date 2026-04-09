import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { walkFile } from "@/utils";
import cfg from "@/uxu.local.json";

export default new Command("folder").action(async () => {
  await folder(process.cwd());
});

async function folder(dirname: string) {
  const files = await fs.promises.readdir(dirname);

  for (const file of files) {
    const filename1 = path.join(dirname, file);
    const stat = await fs.promises.stat(filename1);
    if (!stat.isDirectory()) continue;

    await callback(file);
  }

  async function callback(sub: string) {
    const { extension } = cfg;

    let filename1: string | null = null;
    await walkFile(path.join(dirname, sub), (file) => {
      if (extension.every((ext) => !file.endsWith(ext))) return;
      filename1 = path.join(dirname, sub, file);
    });
    if (!filename1) {
      console.warn(`failed to resolve - ${sub}`);
    } else {
      const ext = path.extname(filename1);
      const filename2 = path.join(dirname, sub + ext);
      await fs.promises.rename(filename1, filename2);
    }
  }
}

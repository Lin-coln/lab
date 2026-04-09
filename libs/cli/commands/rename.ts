import { Command } from "commander";
import path from "node:path";
import fs from "node:fs";
import { check } from "@/commands/check";

export default new Command("rename").action(async () => {
  await rename(process.cwd());
});

async function rename(dirname: string) {
  const items = await check(dirname);
  for (const x of items) {
    const filename1 = path.join(dirname, x.basename + x.ext);
    const filename2 = path.join(dirname, x.nextname + x.ext);

    if (fs.existsSync(filename2) && x.basename.toUpperCase() !== x.nextname) {
      console.warn(`failed to rename existed file - ${filename1} to ${filename2}`);
    } else {
      await fs.promises.rename(filename1, filename2);
    }
  }
}

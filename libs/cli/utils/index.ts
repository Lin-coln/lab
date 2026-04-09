import fs from "node:fs";
import path from "node:path";

export async function walkFile(dirname: string, callback: (file: string) => any) {
  const files = await fs.promises.readdir(dirname);

  for (const file of files) {
    const filename1 = path.join(dirname, file);
    const stat = await fs.promises.stat(filename1);
    if (stat.isDirectory()) continue;

    await callback(file);
  }
}

#!/usr/bin/env bun

import * as fs from "node:fs";
import * as path from "node:path";
import cfg from "./.config.json";
import { Command, program } from "commander";

const { prefix, extension } = cfg;

program
  .name("uxu")
  .version("0.0.1")
  .addCommand(createCheckCommand())
  .addCommand(createRenameCommand())
  .addCommand(createFolderCommand());
program.parse(process.argv);

function createCheckCommand() {
  return new Command("check").action(async () => {
    await check(process.cwd());
  });
}

function createRenameCommand() {
  return new Command("rename").action(async () => {
    await rename(process.cwd());
  });
}
function createFolderCommand() {
  return new Command("folder").action(async () => {
    await folder(process.cwd());
  });
}

async function check(dirname: string) {
  const items: { basename: string; nextname: string; ext: string }[] = [];
  await walkFile(dirname, (file) => {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const nextname = resolveNextname(basename);
    if (!nextname) return;
    if (nextname === basename) return;
    console.log(nextname, basename);
    items.push({ basename, nextname, ext });
  });

  return items;
}

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

async function folder(dirname: string) {
  const files = await fs.promises.readdir(dirname);

  for (const file of files) {
    const filename1 = path.join(dirname, file);
    const stat = await fs.promises.stat(filename1);
    if (!stat.isDirectory()) continue;

    await callback(file);
  }

  async function callback(sub: string) {
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

///

async function walkFile(dirname: string, callback: (file: string) => any) {
  const files = await fs.promises.readdir(dirname);

  for (const file of files) {
    const filename1 = path.join(dirname, file);
    const stat = await fs.promises.stat(filename1);
    if (stat.isDirectory()) continue;

    await callback(file);
  }
}

function resolveNextname(basename: string) {
  const regex = new RegExp(`(${prefix.join("|")})-?([0-9a-zA-Z]+)`, "i");

  const match = basename.match(regex);
  if (!match) {
    console.warn(`failed to resolve nextname - ${basename}`);
    return;
  }

  const pre = match[1]!.toUpperCase();
  const suf = match[2]!;
  return `${pre}-${suf}`;
}

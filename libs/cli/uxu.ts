#!/usr/bin/env bun

import path from "node:path";
import { Command } from "commander";

const cmdDir = path.resolve(import.meta.dir, "commands");
const program = new Command("uxu");

for (const file of await findCommandFiles()) {
  try {
    const module = await import(file);
    const command = module.default;

    if (!(command instanceof Command)) {
      console.error(`Error: ${file} does not export a Command instance`);
      process.exit(1);
    }

    program.addCommand(command);
  } catch (error) {
    console.error(`Error loading command from ${file}:`, error);
    process.exit(1);
  }
}

await program.parseAsync();

async function findCommandFiles(): Promise<string[]> {
  const files: string[] = [];

  const directFiles = new Bun.Glob("*.ts");
  for await (const file of directFiles.scan({ cwd: cmdDir })) {
    files.push(path.resolve(cmdDir, file));
  }

  const indexFiles = new Bun.Glob("*/index.ts");
  for await (const file of indexFiles.scan({ cwd: cmdDir })) {
    files.push(path.resolve(cmdDir, file));
  }

  return files;
}

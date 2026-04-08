import { z } from "zod";

export default {
  name: "bash",
  description: "Execute a shell command using bash",
  input: z.object({
    command: z.string().describe("The bash command to execute"),
  }),
  handler: bash,
};

async function bash({ command }: { command: string }) {
  const timeout = 3_000;
  const controller = new AbortController();

  const proc = Bun.spawn({
    cmd: ["bash", "-lc", command],
    stdout: "pipe",
    stderr: "pipe",
    signal: controller.signal,
  });

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    clearTimeout(timer);

    return {
      exitCode,
      stdout: truncate(stdout),
      stderr: truncate(stderr),
    };
  } catch (error) {
    clearTimeout(timer);

    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function truncate(str: string, max = 8000) {
  if (str.length <= max) return str;
  return str.slice(0, max) + "\n...[truncated]";
}

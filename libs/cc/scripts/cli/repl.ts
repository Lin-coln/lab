import readline from "node:readline";
import chalk, { type ChalkInstance } from "chalk";
import { type AOP, createFunction, type StreamEvent } from "cc";

export type Flag = void | "exit" | "continue";

export type UI = ReturnType<typeof createUI>;

export function createREPL(onLoop: (input: string) => Promise<Flag>, opts: { onInterrupt: () => void }) {
  let sigintCount = 0;
  let loopRunning = false;

  const ui = createUI();
  const cmd = createCommandContext();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("SIGINT", handleSIGINT);

  const handleLoop = createFunction(onLoop)
    .use(cmd.mw)
    .catch((err: any) => {
      if (err.name !== "AbortError" && err.message?.includes("aborted")) {
        ui.error(err.message);
      }
    });

  return {
    start,
    exit,
    ui,
    cmd: cmd.add.bind(cmd),
    renderStream: (s: AsyncIterable<StreamEvent>) => renderStream(ui, s),
  };

  async function start() {
    while (true) {
      const input: string = await new Promise<string>((resolve) => {
        ui.write(chalk.hex("#006721")("> "));
        rl.once("line", (line) => resolve(line));
      });
      if (!input) continue;
      sigintCount = 0;

      try {
        loopRunning = true;
        const flag = await handleLoop(input);
        if (flag === "exit") break;
      } finally {
        loopRunning = false;
      }
    }
    exit();
  }

  function exit() {
    rl.close();
    process.exit(0);
  }

  function handleSIGINT() {
    if (loopRunning) {
      opts.onInterrupt();
      return;
    }

    sigintCount++;
    if (sigintCount < 2) {
      ui.info("Press Ctrl+C again to exit.");
      return;
    }

    exit();
  }
}

function createUI() {
  let needRet: boolean = false;
  return {
    // log levels
    info: (...data: any[]) => log(chalk.white, "[INFO]", ...data),
    warn: (...data: any[]) => log(chalk.yellow, "[WARN]", ...data),
    error: (...data: any[]) => log(chalk.red, "[ERROR]", ...data),
    // write
    write,
  };
  function log(c: ChalkInstance | null, ...data: any[]) {
    if (needRet) write("\n");
    if (!c) {
      console.log(...data);
    } else {
      console.log(...data.map((x) => (typeof x === "string" ? c(x) : x)));
    }
  }
  function write(str: string) {
    needRet = !str.endsWith("\n");
    process.stdout.write(str);
  }
}

function createCommandContext() {
  const commands = new Map<string, (input: string) => Flag | Promise<Flag>>();
  const mw: AOP.MW<[string], Flag> = (next, input) => {
    const [name, args] = resolveFromInput(input);
    if (!name) return next(input);
    return commands.get(name)!(args);
  };

  return { add, mw };

  function add(data: Record<string, (input: string) => Flag | Promise<Flag>>) {
    Object.entries(data).forEach(([name, handle]) => {
      commands.set(name, handle);
    });
  }

  function resolveFromInput(input: string) {
    const regex = /^\/([a-z][a-z0-9_]*)(?:\s+(.*))?$/;
    const match = regex.exec(input);
    if (!match) return [];
    const name = match[1]!;
    const args = match[2] ?? "";
    if (!commands.has(name)) return [];
    return [name, args] as const;
  }
}

async function renderStream(ui: UI, iterable: AsyncIterable<StreamEvent>) {
  const modelName = "model";
  let reason: number = -1;
  let message: number = -1;

  for await (const event of iterable) {
    handleReasoning(event);
    handleMessage(event);
  }

  function handleReasoning(event: StreamEvent) {
    const c = chalk.dim.white;
    if (event.type === "response.output_item.added") {
      if (event.item.type === "reasoning") {
        reason = event.item_index;
        ui.write(c(`${modelName}(thinking): `));
      }
    }
    if (event.type === "response.output_item.done") {
      if (event.item.type === "reasoning") {
        ui.write("\n");
      }
    }
    if (event.type === "response.delta.content_part.text") {
      if (event.item_index === reason) {
        ui.write(c(event.delta));
      }
    }
  }

  function handleMessage(event: StreamEvent) {
    const c = chalk.white;
    if (event.type === "response.output_item.added") {
      if (event.item.type === "message" && event.item.role === "assistant") {
        message = event.item_index;
        ui.write(chalk.hex("#006721")(`${modelName}: `));
      }
    }
    if (event.type === "response.output_item.done") {
      if (event.item.type === "message" && event.item.role === "assistant") {
        ui.write("\n");
      }
    }
    if (event.type === "response.delta.content_part.text") {
      if (event.item_index === message) {
        ui.write(c(event.delta));
      }
    }
  }
}

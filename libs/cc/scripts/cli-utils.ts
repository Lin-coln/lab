import readline from "node:readline";
import chalk, { type ChalkInstance } from "chalk";

export async function executeCli(onChat: (input: string) => Promise<void | "close">) {
  const itf = readline.createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    const input: string = await new Promise<string>((resolve) => {
      itf.question("You: ", (answer) => resolve(answer.trim()));
    });
    if (!input) continue;
    const flag = await onChat(input);
    if (flag === "close") {
      itf.close();
      break;
    }
  }
}

export function createLogger() {
  const userName = "user";
  const modelName = "model";

  const chalkModel = chalk.hex("#006721");

  const log = (c: ChalkInstance | null, ...data: any[]) => {
    if (!c) {
      console.log(...data);
    } else {
      console.log(...data.map((x) => (typeof x === "string" ? c(x) : x)));
    }
  };

  return {
    // log levels
    info: (...data: any[]) => log(chalk.white, "[INFO]", ...data),
    warn: (...data: any[]) => log(chalk.yellow, "[WARN]", ...data),
    error: (...data: any[]) => log(chalk.red, "[ERROR]", ...data),

    // roles
    user: (...data: any[]) => log(chalk.white, `${userName}:`, ...data),
    tool: (name: string, ...data: any[]) => log(chalk.cyan, `tool@${name}:`, ...data),
    model: Object.assign(
      (...data: any[]) => log(chalkModel, `${modelName}:`, ...data), // ...
      {
        reasoning: createWriter(chalk.dim.white(`${modelName}(reasoning):`), chalk.dim.white),
        message: createWriter(chalkModel(`${modelName}:`), chalkModel),
      },
    ),
  };
}

function createWriter(start: string, c: ChalkInstance) {
  return {
    start: () => process.stdout.write(start + " "),
    write: (chunk: string) => process.stdout.write(c(chunk)),
    stop: () => process.stdout.write("\n"),
  };
}

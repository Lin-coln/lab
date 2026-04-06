import chalk, { type ChalkInstance } from "chalk";

type LogLevel = "info" | "warn" | "error";

export type Logger = Record<LogLevel, (...data: any[]) => void> & {
  user: RoleLogger;
  model: RoleLogger<{ thinking: 0; content: 0 }>;
};

type RoleLogger<T extends Record<string, any> | void = void> = {
  (...data: any[]): void;
} & (T extends void
  ? {}
  : {
      [key in keyof T]: (str: string) => void;
    } & {
      stop: () => void;
    });

export function createLogger(): Logger {
  return {
    // log levels
    info: (...data: any[]) => console.log(chalk.white("[INFO]"), ...data),
    warn: (...data: any[]) => console.log(chalk.yellow("[WARN]"), ...data),
    error: (...data: any[]) => console.log(chalk.red("[ERROR]"), ...data),

    // roles
    user: createRoleLogger({ prefix: "user:", c: chalk.white }, {}),
    model: createRoleLogger(
      { prefix: "model:", c: chalk.hex("#006721") },
      {
        thinking: { prefix: "model(thinking):", c: chalk.dim.white },
        content: {},
      },
    ),
  };
}

type RoleLoggerConfig = { prefix?: string; c?: ChalkInstance };

function createRoleLogger<T extends Record<string, any> | void = void>(
  cfg: RoleLoggerConfig,
  opts: Record<keyof T, RoleLoggerConfig>,
): RoleLogger<T> {
  let type: keyof T | null = null;

  if (!Object.keys(opts).length) return logger as any;

  Object.keys(opts).forEach((type) => {
    logger[type] = (str: string) => write(type as keyof T, str);
  });

  return Object.assign(logger, {
    stop() {
      process.stdout.write("\n");
      type = null;
    },
  }) as any;

  function logger(...data: any[]) {
    if (type) {
      process.stdout.write("\n");
      type = null;
    }

    const c = cfg.c ?? chalk.white;
    const prefix = cfg.prefix ?? "";
    if (prefix) {
      console.log(c(prefix), ...data);
    } else {
      console.log(...data);
    }
  }

  function write(next: keyof T, str: string) {
    const c = opts[next].c ?? cfg.c ?? chalk.white;
    const prefix = opts[next].prefix ?? cfg.prefix ?? "";

    if (type !== next) {
      process.stdout.write("\n");
      prefix && process.stdout.write(c(prefix + " "));
    }

    type = next;

    process.stdout.write(c(str));
  }
}

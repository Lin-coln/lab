import type { Tool } from "@/core";
import { type ZodType, toJSONSchema } from "zod";

declare module "@/core" {
  export namespace Tool {
    export interface Context {
      resolveTools(): Promise<Tool[]>;

      add(opts: { name: string; description?: string; input: ZodType; handler: (...args: any[]) => any }): void;
    }
  }
}

export function createToolContext(): Tool.Context {
  const map = new Map<string, Tool>();
  const schema = new Map<string, { input: ZodType }>();
  const handlers = new Map<string, (...args: any[]) => Promise<any>>();

  return {
    async resolveTools(): Promise<Tool[]> {
      return [];
    },

    add(opts) {
      const { name, description, input, handler } = opts;
      map.set(name, {
        type: "function",
        function: {
          name,
          type: "function",
          ...(description ? { description } : {}),
          parameters: toJSONSchema(input),
        },
      });
      schema.set(name, { input });
      handlers.set(name, handler);
    },
  };
}

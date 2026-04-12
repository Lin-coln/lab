import type { Tool } from "./types";
import { toJSONSchema, type ZodType } from "zod";

export function createToolContext(): Tool.Context {
  const map = new Map<string, Tool>();
  const schema = new Map<string, { input: ZodType }>();
  const handlers = new Map<string, (...args: any[]) => Promise<any>>();

  return {
    async resolveTools(): Promise<Tool[]> {
      return Array.from(map.values());
    },

    add(opts) {
      const { name, description, input, handler } = opts;
      map.set(name, {
        name,
        description,
        type: "function",
        parameters: toJSONSchema(input) as any,
      });
      schema.set(name, { input });
      handlers.set(name, handler);
    },

    async call(name: string, args: string) {
      const inputSchema = schema.get(name)?.input;
      const handler = handlers.get(name);

      if (!inputSchema || !handler) {
        throw new Error(`tool not found - ${name}`);
      }

      const input = JSON.parse(args);
      const result = inputSchema.safeParse(input);

      if (!result.success) {
        throw result.error;
      }

      const parsedInput = result.data;

      return await handler(parsedInput).then(
        (output) => JSON.stringify({ data: output }),
        (error) => JSON.stringify({ error }),
      );
    },
  };
}

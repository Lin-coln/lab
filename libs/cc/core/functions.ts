import type { Tool } from "ollama";
import { type ZodType, toJSONSchema } from "zod";
import type { MessageContext } from "./message";

declare module "./types" {
  export interface Message {
    tool_calls?: ToolCall[];
    tool_name?: string;
  }
}

interface FunctionRef<T extends Record<string, any>> {
  tool: Tool;
  schema: ZodType<T>;
  handler: (args: T) => any;
}

interface FunctionContext {
  readonly createStream: MessageContext["createStream"];
  readonly upsertMessage: MessageContext["upsert"];
  readonly name: string;
  readonly args: Record<string, any>;
}

export class Functions {
  #items: Map<string, FunctionRef<any>> = new Map();

  constructor() {
    this.add = this.add.bind(this);
    this.getTools = this.getTools.bind(this);
    this.call = this.call.bind(this);
  }

  add<T>(opts: { name: string; description: string; schema: ZodType<T>; handler: (params: T) => Promise<any> }) {
    const schema = toJSONSchema(opts.schema);
    const tool: Tool = {
      type: "function",
      function: {
        name: opts.name,
        description: opts.description,
        parameters: {
          type: schema.type,
          properties: schema.properties as any,
          required: schema.required,
        },
      },
    };

    const name = tool.function.name;
    if (!name) throw new Error("function name not found");
    this.#items.set(name, { tool, schema: opts.schema, handler: opts.handler });
  }

  getTools(): Tool[] {
    return Array.from(this.#items.values(), (x) => x.tool);
  }

  async call(ctx: FunctionContext) {
    const { name, args } = ctx;
    let output: any;
    const stream = ctx.createStream({ role: "tool", tool_name: name, content: "" });
    try {
      const data = await this.#handleCall(name, args);
      output = { data, error: null };
    } catch (err: any) {
      const error =
        typeof err === "string" ? err : "message" in err ? err.message : `failed to call function - ${name}`;
      output = { data: null, error };
    }
    stream.message.content = JSON.stringify(output);
    stream.message.done = true;
    ctx.upsertMessage(stream.message);
  }

  async #handleCall(name: string, args: Record<string, any>) {
    const item = this.#items.get(name);
    if (!item) throw new Error(`Function not found - ${name}`);

    const result = item.schema.safeParse(args);
    if (!result.success) {
      console.error(result.error);
      throw new Error(`Invalid args`);
    }

    return await item.handler(result.data);
  }
}

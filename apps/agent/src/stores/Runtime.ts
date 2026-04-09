import z from "zod";
import { createMessageContext, createToolContext, type Message, type Tool } from "cc";
import { createAdapter } from "cc/ollama.adapter";

const systemPrompt = `# TOOL USE

You have access to a set of tools that
are executed upon the user's approval.
You can use one tool per message, and
will receive the result of that tool
use in the user's response. You use
tools step-by-step to accomplish a
given task, with each tool use
informed by the result of the previous
tool use.

# THINK

thinking in chinese, don't thinking too long`;

export function createRuntime(onUpsert: (msg: Message, meta: Message.Metadata) => void) {
  const ctx$msg: Message.Context = createMessageContext();
  const ctx$tool: Tool.Context = createToolContext();

  // await loadTools(ctx$tool);
  ctx$tool.add({
    name: "get_current_weather",
    description: "Get the current weather for a city",
    input: z.object({
      city: z.string().describe("The city and state, e.g. San Francisco, CA"),
    }),
    handler: async ({ city }) => {
      return { city, weather: "Sunny", temp: "25°C" };
    },
  });

  const adapter = createAdapter(uuid);

  return {
    async chat(input: string) {
      await ctx$msg.upsert({ role: "user", content: input }, { id: uuid() }).then(([msg, meta]) => onUpsert(msg, meta));
      await handleReAct();
      try {
      } catch (e) {
        console.error(`[ERROR]\n\n${e as any}\n`);
      }
    },
  };

  async function handleReAct() {
    while (true) {
      // todo compact

      const { upsertPromise, stream } = await handleChatWithModel();

      await Promise.all([upsertPromise, Promise.resolve()]);

      const [msg] = await upsertPromise;

      if (msg.tool_calls?.length) {
        await handleToolCalls(msg.tool_calls);
        continue;
      }

      break;
    }
  }

  async function handleChatWithModel() {
    const stream0 = await adapter.createMessageStream({
      model: "qwen3:4b",
      messages: await ctx$msg.resolveMessages(),
      tools: await ctx$tool.resolveTools(),
    });

    const [stream1, stream2] = stream0.tee();

    const upsertPromise = ctx$msg.upsertFromStream(stream1).then(([msg, meta]) => {
      onUpsert(msg, meta);
      return [msg, meta] as const;
    });

    return { stream: stream2, upsertPromise };
  }

  async function handleToolCalls(tool_calls: Tool.Call[]) {
    for (const call of tool_calls) {
      const name = call.function.name;
      const args = call.function.arguments;
      console.log(`[tool::${name}] ${args}`);
      const content = await ctx$tool.call(name, args);
      await ctx$msg
        .upsert({ role: "tool", tool_call_id: call.id, content }, { id: uuid() })
        .then(([msg, meta]) => onUpsert(msg, meta));
      console.log(`[tool::${name}] \n${args}`);
    }
  }
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

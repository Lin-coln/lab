import z from "zod";
import { createItemContext, createToolContext, type Item, type StreamEvent, teeAsyncIterable, type Tool } from "cc";
import { createAdapter } from "cc/lms.adapter";

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

export function createRuntime(onUpsert: (item: Item) => void) {
  const adapter = createAdapter();
  const ctx$item = createItemContext();
  const ctx$tool: Tool.Context = createToolContext();

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

  return {
    async chat(input: string) {
      try {
        await ctx$item.insert({ type: "message", role: "user", content: input }).then(onUpsert);
        while (true) {
          const iterable = await handleChatWithModel();
          const called = await handleToolCall(iterable);
          if (called) continue;
          break;
        }
      } catch (e) {
        console.error(`[ERROR]\n\n${e as any}\n`);
      }
    },
  };

  async function handleChatWithModel() {
    const iterable = await adapter.createResponse({
      model: "qwen3.5-9b-mlx",
      input: [
        { type: "message", role: "system", content: systemPrompt },
        ...(await ctx$item.resolveItems()), //
      ],
      tools: await ctx$tool.resolveTools(),
      signal: new AbortController().signal,
    });

    const [iterable0, iterable1] = teeAsyncIterable(iterable);
    const [iterable2, iterable3] = teeAsyncIterable(iterable1);
    await Promise.all([ctx$item.insertFromStreamEvents(iterable2), promiseUpsert(iterable3)]);
    return iterable0;
  }

  async function handleToolCall(iterable: AsyncIterable<StreamEvent>) {
    let hasToolCalls = false;
    for await (const event of iterable) {
      if (event.type !== "response.output_item.done") continue;
      if (event.item.type !== "tool_call") continue;

      hasToolCalls = true;

      const call = event.item;
      console.log(`[tool::${call.name}] ${call.arguments}`);
      const output = await ctx$tool.call(call.name, call.arguments);
      console.log(`[tool::${call.name}] \n${output}`);

      await ctx$item.insert({ type: "tool_call_output", call_id: call.call_id, output }).then(onUpsert);
    }

    return hasToolCalls;
  }

  async function promiseUpsert(iterable: AsyncIterable<StreamEvent>) {
    for await (const event of iterable) {
      if (event.type === "response.output_item.done") {
        // event.item_index; event.item;
        onUpsert(event.item);
      }
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

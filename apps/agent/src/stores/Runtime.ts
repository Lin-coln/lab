import z from "zod";
import {
  type Content,
  createChatAPI,
  createItemContext,
  createToolContext,
  type Item,
  type StreamEvent,
  type Tool,
} from "cc";
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

export function createRuntime(onUpsert: (data: Item | ((prev: Item[]) => void | [Item, number])) => number) {
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

  const chat = createChatAPI(async (signal) =>
    adapter.createResponse({
      model: "google/gemma-4-e4b",
      input: [
        { type: "message", role: "system", content: systemPrompt },
        ...(await ctx$item.resolveItems()), //
      ],
      tools: await ctx$tool.resolveTools(),
      signal,
    }),
  );

  chat.hook(
    (s) => ctx$item.insertFromStreamEvents(s),
    (s) => promiseUpsert(s),
  );

  return {
    async chat(input: string) {
      try {
        await ctx$item.insert({ type: "message", role: "user", content: input }).then(onUpsert);
        while (true) {
          const s = await chat();
          const called = await handleToolCall(s);
          if (called) continue;
          break;
        }
      } catch (e) {
        console.error(`[ERROR]\n\n${e as any}\n`);
      }
    },
  };

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
    let index: number = -1;
    let item: Item | null = null;
    let item_index: number = -1;
    let part_index: number = -1;

    for await (const event of iterable) {
      handleOutputItem(event);
      handleContentPart(event);
    }

    function handleOutputItem(event: StreamEvent) {
      if (event.type === "response.output_item.added") {
        index = onUpsert(event.item);
        item = event.item;
        item_index = event.item_index;
      }
      if (event.type === "response.output_item.done") {
        if (event.item_index !== item_index) return;
        item = event.item;
        onUpsert(() => [item!, index]);
      }
      if (event.type === "response.delta.tool_call_arguments") {
        if (event.item_index !== item_index) return;
        (item as any).arguments += event.delta;
      }
    }

    function handleContentPart(event: StreamEvent) {
      if (event.type === "response.content_part.added") {
        if (event.item_index !== item_index) return;
        (item as any).content.push(event.part);
        onUpsert(() => [item!, index]);
        part_index = event.part_index;
      }
      if (event.type === "response.content_part.done") {
        if (event.item_index !== item_index) return;
        if (event.part_index !== part_index) return;
        (item as any).content[part_index] = event.part;
        onUpsert(() => [item!, index]);
      }
      if (event.type === "response.delta.content_part.text") {
        if (event.item_index !== item_index) return;
        if (event.part_index !== part_index) return;
        ((item as any).content[part_index] as Content.Text).text += event.delta;
        onUpsert(() => [item!, index]);
      }
    }
  }
}

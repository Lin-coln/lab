import { createREPL, type Flag } from "./repl";
import { createChatAPI, createItemContext, createToolContext, type StreamEvent, teeAsyncIterable } from "cc";
import { createAdapter } from "cc/lms.adapter";
import chalk from "chalk";
import bash from "../tools/bash";

const adapter = createAdapter();
const ctx$item = createItemContext();
const ctx$tool = createToolContext();
ctx$tool.add(bash);
// instances
const chat = createChatAPI(async (signal) =>
  adapter.createResponse({
    model: "google/gemma-4-e4b",
    input: [
      { type: "message", role: "system", content: `u can use the provided tools, cwd: ${process.cwd()}` },
      ...(await ctx$item.resolveItems()), //
    ],
    tools: await ctx$tool.resolveTools(),
    signal,
  }),
);
const repl = createREPL(
  async (input: string): Promise<Flag> => {
    await ctx$item.insert({ type: "message", role: "user", content: input });
    // ReAct
    while (true) {
      const s = await chat();
      const called = await handleToolCall(s);
      if (called) continue;
      break;
    }
    // await chat();
  },
  {
    onInterrupt() {
      chat.abort();
      repl.ui.info("interrupted");
    },
  },
);
repl.cmd({ exit: () => "exit" });
chat.hook(repl.renderStream, (s) => ctx$item.insertFromStreamEvents(s));
await repl.start();

async function handleToolCall(iterable: AsyncIterable<StreamEvent>) {
  const c = chalk.cyan;
  let hasToolCalls = false;
  for await (const event of iterable) {
    if (event.type !== "response.output_item.done") continue;
    if (event.item.type !== "tool_call") continue;

    hasToolCalls = true;

    const call = event.item;
    repl.ui.write(c(`tool@${call.name}: ${call.arguments}\n`));
    const output = await ctx$tool.call(call.name, call.arguments);
    repl.ui.write(c(`tool@${call.name}: ${output}\n`));
    await ctx$item.insert({ type: "tool_call_output", call_id: call.call_id, output });
  }

  return hasToolCalls;
}

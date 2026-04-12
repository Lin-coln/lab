import { createLogger, executeCli } from "./cli-utils";
import { createItemContext, createToolContext, type StreamEvent, teeAsyncIterable } from "cc";
import { createAdapter } from "cc/lms.adapter";
import bash from "./tools/bash";

const logger = createLogger();
const adapter = createAdapter();
const ctx$item = createItemContext();
const ctx$tool = createToolContext();

ctx$tool.add(bash);

await executeCli(async (input) => {
  if (["/exit", "/quit"].includes(input)) {
    logger.model("bye");
    return "close";
  }

  await ctx$item.insert({ type: "message", role: "user", content: input });

  // ReAct
  while (true) {
    const iterable = await handleChatWithModel();
    const called = await handleToolCall(iterable);
    if (called) continue;
    break;
  }
});

async function handleChatWithModel() {
  const iterable = await adapter.createResponse({
    model: "qwen3.5-9b-mlx",
    input: [
      { type: "message", role: "system", content: `u can use the provided tools, cwd: ${process.cwd()}` },
      ...(await ctx$item.resolveItems()), //
    ],
    tools: await ctx$tool.resolveTools(),
  });

  const [iterable0, iterable1] = teeAsyncIterable(iterable);
  const [iterable2, iterable3] = teeAsyncIterable(iterable1);
  await Promise.all([
    handleLogResponse(iterable0), // log
    ctx$item.insertFromStreamEvents(iterable2), // insert
  ]);

  return iterable3;
}

async function handleLogResponse(iterable: AsyncIterable<StreamEvent>) {
  let reason: number = -1;
  let message: number = -1;
  for await (const event of iterable) {
    if (event.type === "response.output_item.added") {
      if (event.item.type === "reasoning") {
        reason = event.item_index;
        logger.model.reasoning.start();
      }
      if (event.item.type === "message" && event.item.role === "assistant") {
        message = event.item_index;
        logger.model.message.start();
      }
    }
    if (event.type === "response.output_item.done") {
      if (event.item.type === "reasoning") {
        logger.model.reasoning.stop();
      }
      if (event.item.type === "message" && event.item.role === "assistant") {
        logger.model.message.stop();
      }
    }
    if (event.type === "response.delta.content_part.text") {
      if (event.item_index === reason) {
        logger.model.reasoning.write(event.delta);
      }
      if (event.item_index === message) {
        logger.model.message.write(event.delta);
      }
    }
  }
}

async function handleToolCall(iterable: AsyncIterable<StreamEvent>) {
  let hasToolCalls = false;
  for await (const event of iterable) {
    if (event.type !== "response.output_item.done") continue;
    if (event.item.type !== "tool_call") continue;

    hasToolCalls = true;

    const call = event.item;
    logger.tool(call.name, call.arguments);
    const output = await ctx$tool.call(call.name, call.arguments);
    logger.tool(call.name, output);

    await ctx$item.insert({
      type: "tool_call_output",
      call_id: call.call_id,
      output,
    });
  }

  return hasToolCalls;
}

import { createREPL, type Flag, type UI } from "./repl";
import {
  createAOP,
  createFunction,
  createItemContext,
  createToolContext,
  type Item,
  type StreamEvent,
  teeAsyncIterable,
  type Tool,
} from "cc";
import { createAdapter } from "cc/lms.adapter";
import bash from "../tools/bash";
import chalk from "chalk";

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
const onLoop = createFunction(async (input: string): Promise<Flag> => {
  await ctx$item.insert({ type: "message", role: "user", content: input });
  // ReAct
  while (true) {
    const s = await chat();
    const called = await handleToolCall(s);
    if (called) continue;
    break;
  }
  // await chat();
});
const repl = createREPL(onLoop, {
  onInterrupt() {
    chat.abort();
  },
});
// aop
onLoop.use(async (next, input) => {
  if (["/exit", "/quit"].includes(input)) return "exit";
  return next(input);
});
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

function createChatAPI(onChat: (signal: AbortSignal) => Promise<AsyncIterable<StreamEvent>>) {
  type Stream = AsyncIterable<StreamEvent>;
  type ChatAPI = {
    (): Promise<Stream>;
    abort(): void;
    hook(...hooks: ((s: Stream) => unknown)[]): ChatAPI;
  };
  return createAOP<ChatAPI, [], Stream>((ctx) => {
    let abortController: AbortController | null = null;
    const fn = async () => {
      abortController = new AbortController();
      return await onChat(abortController.signal).finally(() => {
        abortController = null;
      });
    };

    return Object.assign(() => ctx.wrap(fn)(), {
      hook,
      abort() {
        abortController?.abort();
      },
    });

    function hook(this: ChatAPI, ...hooks: ((s: Stream) => unknown)[]) {
      if (!hooks.length) return this;

      ctx.use(async (next) => {
        let s0 = await next();
        let s1: Stream;
        let s2: Stream;
        [s0, s1] = teeAsyncIterable(s0);
        await Promise.all(
          hooks.map((hook, i, arr) => {
            if (i === arr.length - 1) return hook(s1);
            [s1, s2] = teeAsyncIterable(s1);
            return hook(s2);
          }),
        );
        return s0;
      });

      return this;
    }
  });
}

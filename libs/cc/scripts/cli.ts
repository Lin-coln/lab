import readline from "readline";
import { type Message, type Stream, type Tool } from "@/core";
import { createMessageContext, createToolContext } from "@/context";
import { createAdapter } from "./ollama.adapter";
import { createLogger, type Logger } from "./logger";
import { loadTools } from "./tools";

const itf = readline.createInterface({ input: process.stdin, output: process.stdout });
const runtime = await createRuntime();

while (true) {
  const input: string = await question();
  if (["/exit", "/quit"].includes(input)) {
    itf.close();
    break;
  }

  await runtime.chat(input);
}

async function question() {
  return new Promise<string>((resolve) => {
    itf.question("You: ", (answer) => resolve(answer.trim()));
  });
}

// ollama runtime
async function createRuntime() {
  const logger: Logger = createLogger();
  const ctx$msg: Message.Context = createMessageContext();
  const ctx$tool: Tool.Context = createToolContext();

  await loadTools(ctx$tool);
  const adapter = createAdapter(() => Bun.randomUUIDv7());

  return {
    async chat(input: string) {
      await ctx$msg.upsert({ role: "user", content: input }, { id: Bun.randomUUIDv7() });
      await handleReAct();
      try {
      } catch (e) {
        logger.error(`\n\n${e as any}\n`);
      }
    },
  };

  async function handleReAct() {
    while (true) {
      // todo compact

      const { upsertPromise, stream } = await handleChatWithModel();

      await Promise.all([upsertPromise, promiseLogMessage(stream, logger)]);

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

    const upsertPromise = ctx$msg.upsertFromStream(stream1);

    return { stream: stream2, upsertPromise };
  }

  async function handleToolCalls(tool_calls: Tool.Call[]) {
    for (const call of tool_calls) {
      const name = call.function.name;
      const args = call.function.arguments;
      logger.info(`[tool::${name}] ${args}`);
      const content = await ctx$tool.call(name, args);
      await ctx$msg.upsert({ role: "tool", tool_call_id: call.id, content }, { id: Bun.randomUUIDv7() });
      logger.info(`[tool::${name}] \n${args}`);
    }
  }
}

async function promiseLogMessage(stream: Stream<Message.StreamEvent>, logger: Logger) {
  for await (const evt of stream) {
    if (evt.type === "message_chunk") {
      if (evt.content) {
        logger.model.content(evt.content);
      }
      if (evt.reasoning) {
        logger.model.reasoning(evt.reasoning);
      }
    }
    if (evt.type === "message_finish") {
      logger.model.stop();
      return;
    }
  }

  throw new Error("Failed to log message");
}

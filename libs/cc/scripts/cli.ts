import readline from "readline";
import { type Message, type Stream } from "@/core";
import { createMessageContext } from "@/context";
import { createAdapter } from "./ollama.adapter";
import { createLogger, type Logger } from "./logger";

const itf = readline.createInterface({ input: process.stdin, output: process.stdout });
const runtime = await createRuntime();

while (true) {
  const input: string = await question();
  if (["exit", "quit"].includes(input)) {
    itf.close();
    break;
  }

  await runtime.chat(input);
}

process.exit(0);

async function question() {
  return new Promise<string>((resolve) => {
    itf.question("You: ", (answer) => resolve(answer.trim()));
  });
}

//// ollama runtime
async function createRuntime() {
  const logger: Logger = createLogger();
  const ctx: Message.Context = createMessageContext();
  const adapter = createAdapter();

  return { chat };

  async function chat(input: string) {
    await ctx.upsert({ role: "user", content: input }, { id: Bun.randomUUIDv7() });
    const stream0 = await adapter.createMessageStream({
      model: "qwen3:4b",
      messages: await ctx.resolveMessages(),
    });
    const [stream1, stream2] = stream0.tee();
    await Promise.all([
      ctx.upsertFromStream(stream1), // upsert
      promiseLogMessage(stream2, logger),
    ]);
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

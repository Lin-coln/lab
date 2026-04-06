import readline from "readline";
import { createMessageContext, type Message, type Stream } from "../src/core";
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
      messages: await ctx.resolveMessages(),
    });
    const [stream1, stream2] = stream0.tee();
    await Promise.all([
      promiseUpsertMessage(stream1, ctx), // upsert
      promiseLogMessage(stream2, logger),
    ]);
  }
}

async function promiseUpsertMessage(stream: Stream<Message.StreamEvent>, ctx: Message.Context) {
  let msg: Message | null = null;
  let meta: Message.Metadata | null = null;
  for await (const evt of stream) {
    if (evt.type === "message_start") {
      meta = { id: evt.id, created_at: evt.created_at };
      msg = { role: evt.role, content: evt.content };
    }
    if (!msg || !meta) {
      throw new Error("Failed to update message");
    }

    if (evt.type === "message_chunk") {
      if (evt.content) {
        msg.content += evt.content;
      }

      if (evt.thinking) {
        msg.thinking ??= "";
        msg.thinking += evt.thinking;
      }
    }

    if (evt.type === "message_stop") {
      return await ctx.upsert(msg, meta);
    }
  }

  throw new Error("Failed to update message");
}

async function promiseLogMessage(stream: Stream<Message.StreamEvent>, logger: Logger) {
  for await (const evt of stream) {
    if (evt.type === "message_chunk") {
      if (evt.content) {
        logger.model.content(evt.content);
      }
      if (evt.thinking) {
        logger.model.thinking(evt.thinking);
      }
    }
    if (evt.type === "message_stop") {
      logger.model.stop();
      return;
    }
  }

  throw new Error("Failed to log message");
}

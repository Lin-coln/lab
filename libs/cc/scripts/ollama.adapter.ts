import { createStreamFromIterator, type Message, type Stream } from "@/core";
import { type AbortableAsyncIterator, type ChatResponse, Ollama } from "ollama";

export function createAdapter() {
  const ollama = new Ollama();

  return {
    createMessageStream,
  };

  async function createMessageStream(opts: { model: string; messages: Message[] }) {
    const iterable = await ollama.chat({
      stream: true,
      think: true,
      model: opts.model,
      messages: opts.messages,
    });
    return createStreamFromOllamaIterable(iterable);
  }
}

function createStreamFromOllamaIterable(iterable: AbortableAsyncIterator<ChatResponse>): Stream<Message.StreamEvent> {
  const controller = new AbortController();
  controller.signal.addEventListener("abort", () => iterable.abort());

  let id: string | null = null;
  return createStreamFromIterator<Message.StreamEvent>(
    async function* () {
      for await (const resp of iterable) {
        const msg = resp.message;

        if (!id) {
          id = Bun.randomUUIDv7();
          yield {
            type: "message_start",
            id,
            created_at: resolveOllamaCreatedAt(resp.created_at),
            role: "assistant",
            content: "",
          };
        }

        if (msg.content) {
          yield { type: "message_chunk", content: msg.content };
        }

        if (msg.thinking) {
          yield { type: "message_chunk", thinking: msg.thinking };
        }

        if (resp.done) {
          yield { type: "message_stop" };
        }
      }
    },
    { controller },
  );
}

function resolveOllamaCreatedAt(val: Date | string): number {
  if (typeof val === "string") return Date.parse(val);
  return val.valueOf();
}

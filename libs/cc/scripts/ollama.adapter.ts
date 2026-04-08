import { Ollama } from "ollama";
import { createStreamFromIterator, type Message, type Stream, type Tool } from "@/core";
import type { AbortableAsyncIterator, ChatResponse, Message as OllamaMessage, ToolCall } from "ollama";

declare module "ollama" {
  interface ToolCall {
    id: string;
  }
}

export function createAdapter(uuid: () => string) {
  const ollama = new Ollama();

  return {
    createMessageStream,
  };

  async function createMessageStream(opts: { model: string; messages: Message[]; tools?: Tool[] }) {
    const iterable = await ollama.chat({
      stream: true,
      think: true,
      model: opts.model,
      messages: structuredClone(opts.messages).map(resolveOllamaMessage),
      ...(opts.tools ? { tools: structuredClone(opts.tools) } : {}),
    });

    return createStreamFromOllamaIterable(iterable, uuid);
  }
}

function createStreamFromOllamaIterable(
  iterable: AbortableAsyncIterator<ChatResponse>,
  uuid: () => string,
): Stream<Message.StreamEvent> {
  const controller = new AbortController();
  controller.signal.addEventListener("abort", () => iterable.abort());

  let id: string | null = null;
  return createStreamFromIterator<Message.StreamEvent>(
    async function* () {
      for await (const resp of iterable) {
        const msg = resp.message;

        if (!id) {
          id = uuid();
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
          yield { type: "message_chunk", reasoning: msg.thinking };
        }

        if (msg.tool_calls) {
          yield {
            type: "message_chunk",
            tool_calls: msg.tool_calls.map((call) => ({
              id: call.id,
              type: "function",
              function: {
                ...call.function,
                arguments: JSON.stringify(call.function.arguments),
              },
            })),
          };
        }

        if (resp.done) {
          yield { type: "message_finish", reason: resp.done_reason };
        }
      }
    },
    { controller },
  );
}

function resolveOllamaMessage(x: Message): OllamaMessage {
  const { reasoning: thinking, tool_calls: _tool_calls, ...rest } = x;
  const tool_calls: ToolCall[] | void = _tool_calls?.map((call) => ({
    id: call.id,
    function: {
      ...call.function,
      arguments: JSON.parse(call.function.arguments),
    },
  }));
  return {
    ...rest,
    ...(thinking ? { thinking } : {}),
    ...(tool_calls ? { tool_calls } : {}),
  };
}

function resolveOllamaCreatedAt(val: Date | string): number {
  if (typeof val === "string") return Date.parse(val);
  return val.valueOf();
}

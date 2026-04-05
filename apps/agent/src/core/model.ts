import { type Config, type Message as OllamaMessage, Ollama, type Tool } from "ollama";
import type { MessageContext } from "./message";
import type { Message } from "@/types";

interface ChatContext {
  readonly model: string;
  readonly tools: Tool[];
  readonly messages: Message[];
  readonly createStream: MessageContext["createStream"];
  readonly upsertMessage: MessageContext["upsert"];
}

export class Model {
  #ollama: Ollama;
  constructor(config?: Partial<Config>) {
    this.#ollama = new Ollama(config);
  }

  async chat(ctx: ChatContext): Promise<Message> {
    const asyncIterator = await this.#ollama.chat({
      think: true,
      stream: true,
      model: ctx.model,
      tools: ctx.tools,
      messages: ctx.messages.map((x) => this.#resolveOllamaMessage(x)),
      // tools,
      options: {
        temperature: 0,
      },
    });

    const stream = ctx.createStream({ role: "assistant", content: "" });
    for await (const resp of asyncIterator) {
      // thinking
      if (resp.message.thinking) {
        const chunk = resp.message.thinking;
        stream.thinking(chunk);
      }

      // content
      if (resp.message.content) {
        const chunk = resp.message.content;
        stream.content(chunk);
      }

      // tools
      const tool_calls = resp.message.tool_calls;
      if (tool_calls) stream.message.tool_calls = tool_calls;

      if (!resp.done) continue;

      Object.assign(stream.message, {
        done: true,
        done_reason: resp.done_reason,
        total_duration: resp.total_duration,
        prompt_eval_count: resp.prompt_eval_count,
        eval_count: resp.eval_count,
      });
      ctx.upsertMessage(stream.message);
      return stream.message;
    }

    throw new Error("failed to chat");
  }

  #resolveOllamaMessage(x: Message): OllamaMessage {
    return {
      role: x.role,
      content: x.content,
      thinking: x.thinking,
      // images: x.images,
      tool_calls: x.tool_calls,
      tool_name: x.tool_name,
    };
  }
}

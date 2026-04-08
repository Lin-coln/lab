import type { Message, Stream } from "@/core";

declare module "../core" {
  export namespace Message {
    export interface Context {
      resolveMessages(): Promise<Message[]>;

      upsert(msg: Partial<Message>, meta: { id: string; created_at?: number }): Promise<[Message, Message.Metadata]>;

      upsertFromStream(stream: Stream<Message.StreamEvent>): Promise<[Message, Message.Metadata]>;
    }
  }
}

export function createMessageContext(): Message.Context {
  const map = new Map<string, Message>();
  const meta = new Map<string, Message.Metadata>();
  return {
    async resolveMessages() {
      return Array.from(map.entries())
        .sort(([idA], [idB]) => {
          const a = meta.get(idA)?.created_at ?? 0;
          const b = meta.get(idB)?.created_at ?? 0;
          return a - b;
        })
        .map(([, message]) => message);
    },
    async upsert(msg: Partial<Message>, opts: { id: string; created_at?: number }) {
      const metadata = meta.get(opts.id) ?? { id: opts.id, created_at: opts.created_at ?? Date.now() };
      meta.set(metadata.id, metadata);

      const { id } = metadata;
      const next: Message = resolveMergedMessage(map.get(id), msg);
      map.set(id, next);

      return [next, metadata] as [Message, Message.Metadata];
    },
    async upsertFromStream(stream: Stream<Message.StreamEvent>) {
      const [msg, meta] = await resolveMessageFromStream(stream);
      return await this.upsert(msg, meta);
    },
  };
}

async function resolveMessageFromStream(stream: Stream<Message.StreamEvent>) {
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

      if (evt.reasoning) {
        msg.reasoning ??= "";
        msg.reasoning += evt.reasoning;
      }

      if (evt.tool_calls) {
        msg.tool_calls = evt.tool_calls;
      }
    }

    if (evt.type === "message_finish") {
      break;
    }
  }

  if (!msg || !meta) {
    throw new Error("Failed to resolve message from stream");
  }

  return [msg, meta] as const;
}

function resolveMergedMessage(prev: Message | void, next: Partial<Message>): Message {
  const role = next.role ?? prev?.role;

  if (!role) {
    throw new Error("Failed to upsert message - role not found");
  }

  const content = next.content ?? prev?.content ?? "";
  const reasoning = next.reasoning ?? prev?.reasoning;
  const tool_calls = next.tool_calls ?? prev?.tool_calls;

  return {
    role,
    content,
    ...(reasoning ? { reasoning } : {}),
    ...(tool_calls ? { tool_calls } : {}),
  };
}

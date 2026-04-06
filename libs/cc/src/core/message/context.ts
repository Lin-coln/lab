import type { Message } from "@/core";

declare module "./types" {
  export namespace Message {
    export interface Context {
      resolveMessages(): Promise<Message[]>;

      upsert(msg: Partial<Message>, meta: { id: string; created_at?: number }): Promise<[Message, Message.Metadata]>;
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

      return [next, metadata];
    },
  };
}

function resolveMergedMessage(prev: Message | void, next: Partial<Message>): Message {
  const role = next.role ?? prev?.role;

  if (!role) {
    throw new Error("Failed to upsert message - role not found");
  }

  const content = next.content ?? prev?.content ?? "";
  const thinking = next.thinking ?? prev?.thinking;

  return {
    role,
    content,
    ...(thinking ? { thinking } : {}),
  };
}

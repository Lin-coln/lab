import type { Message } from "@/types";

type LooseFields = "id" | "created_at";
type LooseMessage = Omit<Message, LooseFields> & Partial<Pick<Message, LooseFields>>;

namespace MessageNotify {
  export type StreamType = "thinking" | "content";
  export type Payload =
    | { type: "delete"; data: string }
    | { type: "upsert"; data: Message }
    | { type: "streaming"; data: { id: string; key: StreamType; chunk: string } };
  export type Listener = (payload: Payload) => void;
}

export type MessageStream = Record<MessageNotify.StreamType, (chunk: string) => void> & {
  readonly message: Message;
};

export class MessageContext {
  #items: Map<string, Message>;
  constructor(messages: Message[] = []) {
    this.#items = new Map(messages.map((x) => [x.id, x]));
    this.createStream = this.createStream.bind(this);
    this.upsert = this.upsert.bind(this);
  }
  get messages(): Message[] {
    return Array.from(this.#items.values()).sort((a, b) => a.created_at - b.created_at);
  }

  #listeners = new Set<MessageNotify.Listener>();
  #notify(payload: MessageNotify.Payload) {
    this.#listeners.forEach((listener) => listener(payload));
  }
  addListener(listener: MessageNotify.Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #create(loose: LooseMessage) {
    const id = uuid();
    const created_at = loose.created_at ?? Date.now();
    const msg: Message = { id, created_at, ...loose };
    return msg;
  }
  createStream(loose: LooseMessage): MessageStream {
    const msg = this.#create({ ...loose, done: false });
    this.#items.set(msg.id, msg);
    this.#notify({ type: "upsert", data: msg });
    return {
      get message() {
        return msg;
      },
      thinking: (chunk: string) => {
        msg.thinking ??= "";
        msg.thinking += chunk;
        this.#notify({ type: "streaming", data: { id: msg.id, key: "thinking", chunk } });
      },
      content: (chunk: string) => {
        msg.content += chunk;
        this.#notify({ type: "streaming", data: { id: msg.id, key: "content", chunk } });
      },
    };
  }
  upsert(loose: LooseMessage) {
    let msg: Message;
    if (loose.id) {
      msg = loose as Message;
    } else {
      msg = this.#create(loose);
    }
    this.#items.set(msg.id, msg);
    this.#notify({ type: "upsert", data: msg });
    return msg;
  }

  delete(id: string) {
    if (!this.#items.has(id)) return;
    this.#items.delete(id);
    this.#notify({ type: "delete", data: id });
  }
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

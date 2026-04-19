import type { StreamEvent } from "../types";
import { createAOP } from "./aop";
import { teeAsyncIterable } from "../stream";

type Stream = AsyncIterable<StreamEvent>;

export interface ChatAPI {
  (): Promise<Stream>;

  abort(): void;

  hook(...hooks: ((s: Stream) => unknown)[]): ChatAPI;
}

export function createChatAPI(onChat: (signal: AbortSignal) => Promise<AsyncIterable<StreamEvent>>) {
  return createAOP<ChatAPI, [], Stream>((ctx) => {
    let abortController: AbortController | null = null;
    const fn = async () => {
      abortController = new AbortController();
      return await onChat(abortController.signal);
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

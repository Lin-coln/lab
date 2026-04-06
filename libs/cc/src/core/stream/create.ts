import type { Stream } from "@/core";
import { tee } from "./tee";

type StreamOptions = {
  controller: AbortController; // abort
};

export function createStreamFromIterable<T>(iterable: AsyncIterable<T>, opts: StreamOptions) {
  let consumed = false;
  const { controller } = opts;
  return createStreamFromIterator(async function* (): AsyncIterator<T, any, undefined> {
    if (consumed) {
      throw new Error(`Cannot iterate over a consumed stream`);
    }
    consumed = true;
    let done = false;
    try {
      for await (const x of iterable) {
        if (done) continue;
        if (x !== void 0) yield x;
      }
      done = true;
    } catch (err) {
      if (!isAbortError(err)) throw err;
    } finally {
      if (!done) controller.abort();
    }
  }, opts);
}

export function createStreamFromIterator<T>(iterator: () => AsyncIterator<T>, opts: StreamOptions): Stream<T> {
  return {
    controller: opts.controller,
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return iterator();
    },
    tee() {
      return tee(this);
    },
  };
}

function isAbortError(err: unknown) {
  if (!err || typeof err !== "object") return false;

  return !(!("name" in err) || err.name !== "AbortError");
}

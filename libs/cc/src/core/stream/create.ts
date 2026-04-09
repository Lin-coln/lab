import { create, type StreamOptions } from "./base";

export function createStreamFromIterator<T>(iterator: () => AsyncIterator<T>, opts: StreamOptions) {
  const it = iterator();
  return createStreamFromIterable(
    {
      [Symbol.asyncIterator]() {
        return it;
      },
    },
    opts,
  );
}

export function createStreamFromIterable<T>(iterable: AsyncIterable<T>, opts: StreamOptions) {
  let consumed = false;
  const { controller } = opts;
  return create(async function* (): AsyncIterator<T, any, undefined> {
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

function isAbortError(err: unknown) {
  if (!err || typeof err !== "object") return false;

  return !(!("name" in err) || err.name !== "AbortError");
}

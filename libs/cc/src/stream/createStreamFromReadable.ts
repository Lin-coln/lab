import { create, type Stream } from "./create";

export function createStreamFromReadable<T>(readable: ReadableStream<T>): Stream<T> {
  let consumed = false;
  return create(async function* () {
    if (consumed) {
      throw new Error("Cannot iterate over a consumed stream.");
    }
    consumed = true;
    const iterable = readable as any as AsyncIterable<T>;
    for await (const chunk of iterable) {
      yield chunk;
    }
  });
}

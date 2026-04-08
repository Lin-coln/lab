import type { Stream } from "@/core";

export type StreamOptions = {
  controller: AbortController; // abort
};

export function create<T>(iterator: () => AsyncIterator<T>, opts: StreamOptions): Stream<T> {
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

function tee<T>(src: Stream<T>): [Stream<T>, Stream<T>] {
  const left: Promise<IteratorResult<T>>[] = [];
  const right: Promise<IteratorResult<T>>[] = [];
  const iterator = src[Symbol.asyncIterator]();
  const opts = {
    controller: src.controller,
  };
  return [
    create(() => teeIterator(left), opts), // left
    create(() => teeIterator(right), opts), // right
  ];

  function teeIterator(queue: Promise<IteratorResult<T>>[]): AsyncIterator<T> {
    return {
      next: () => {
        if (queue.length === 0) {
          const promise = iterator.next();
          left.push(promise);
          right.push(promise);
        }
        return queue.shift()!;
      },
    };
  }
}

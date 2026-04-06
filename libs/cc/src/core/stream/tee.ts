import type { Stream } from "@/core";
import { createStreamFromIterator } from "@/core";

export function tee<T>(src: Stream<T>): [Stream<T>, Stream<T>] {
  const left: Promise<IteratorResult<T>>[] = [];
  const right: Promise<IteratorResult<T>>[] = [];
  const iterator = src[Symbol.asyncIterator]();
  const opts = {
    controller: src.controller,
  };
  return [
    createStreamFromIterator(() => teeIterator(left), opts), // left
    createStreamFromIterator(() => teeIterator(right), opts), // right
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

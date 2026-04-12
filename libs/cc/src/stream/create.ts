export interface Stream<T> extends AsyncIterable<T> {
  tee(): readonly [Stream<T>, Stream<T>];
}

export function create<T>(iterable: AsyncIterable<T> | (() => AsyncIterator<T>)): Stream<T> {
  const creator: () => AsyncIterator<T> =
    Symbol.asyncIterator in iterable ? () => iterable[Symbol.asyncIterator]() : iterable;
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return creator();
    },
    tee(): [Stream<T>, Stream<T>] {
      const [left, right] = teeAsyncIterable(this);
      return [create(left), create(right)] as const;
    },
  };
}

export function teeAsyncIterable<T>(src: AsyncIterable<T>): [AsyncIterable<T>, AsyncIterable<T>] {
  const left: Promise<IteratorResult<T>>[] = [];
  const right: Promise<IteratorResult<T>>[] = [];
  const iterator: AsyncIterator<T> = src[Symbol.asyncIterator]();
  return [
    {
      [Symbol.asyncIterator]() {
        return teeIterator(left);
      },
    },
    {
      [Symbol.asyncIterator]() {
        return teeIterator(right);
      },
    },
  ] as const;

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

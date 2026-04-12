declare module "../types" {
  namespace Item {
    export interface Context {
      resolveItems(): Promise<Item[]>;

      insert(data: Item): Promise<Item>;

      insertFromStreamEvents(iterable: AsyncIterable<StreamEvent>): Promise<void>;
    }
  }
}

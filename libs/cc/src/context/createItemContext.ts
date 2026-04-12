import type { Item, StreamEvent } from "../types";

export function createItemContext(): Item.Context {
  const items: Item[] = [];
  return {
    async resolveItems() {
      return items;
    },
    async insert(data) {
      items.push(data);
      return data;
    },
    async insertFromStreamEvents(iterable) {
      await insertFromStreamEvents(this, iterable);
    },
  };
}

async function insertFromStreamEvents(ctx: Item.Context, iterable: AsyncIterable<StreamEvent>): Promise<void> {
  for await (const event of iterable) {
    if (event.type === "response.output_item.added") {
      // ...
    } else if (event.type === "response.output_item.done") {
      // event.item_index; event.item;
      await ctx.insert(event.item);
    }
  }
}

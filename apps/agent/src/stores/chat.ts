import { proxy, useSnapshot } from "valtio";
import { createRuntime } from "./Runtime";
import type { Item } from "cc";

interface ChatStore {
  model: string | null;
  items: Item[];
}

const chatStore = proxy<ChatStore>({
  model: "qwen3.5-9b-mlx",
  items: [],
});

const runtime = createRuntime((item) => {
  if (typeof item !== "function") {
    chatStore.items = [...chatStore.items, structuredClone(item)];
    return chatStore.items.length - 1;
  }

  const [next, i] = item(chatStore.items) ?? [];
  if (!next) return -1;

  chatStore.items[i!] = structuredClone(next);
  chatStore.items = [...chatStore.items];
  return i!;
});

export const useChatStore = () => useSnapshot(chatStore);

export async function setChatModel(model: string | null) {
  // agent.model_name = model;
  chatStore.model = model;
}

export async function chat(userInput: string) {
  await runtime.chat(userInput);
}

export async function clearHistory() {
  chatStore.items = [];
}

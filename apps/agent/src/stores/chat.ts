import { proxy, useSnapshot } from "valtio";
import { createRuntime } from "./Runtime";
import type { Item } from "cc";

interface ChatStore {
  model: string | null;
  items: Item[];
}

const chatStore = proxy<ChatStore>({
  // model: null,
  model: "qwen3.5-9b-mlx",
  items: [],
});

const runtime = createRuntime((item) => {
  chatStore.items = [...chatStore.items, structuredClone(item)];
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

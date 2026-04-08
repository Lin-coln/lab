import { proxy, useSnapshot } from "valtio";
import { createRuntime } from "./Runtime";
import { messageStore } from "@/stores/message";

const runtime = createRuntime((msg, meta) => {
  messageStore.messages[meta.id] = {
    ...structuredClone(msg),
    metadata: structuredClone(meta),
  };
});

interface ChatStore {
  model: string | null;
}

const chatStore = proxy<ChatStore>({
  model: null,
});

export const useChatStore = () => useSnapshot(chatStore);

export async function setChatModel(model: string | null) {
  // agent.model_name = model;
  chatStore.model = model;
}

export async function chat(userInput: string) {
  await runtime.chat(userInput);
}

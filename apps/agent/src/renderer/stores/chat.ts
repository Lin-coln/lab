import { proxy, useSnapshot } from "valtio";
import { agent } from "./Runtime.ts";

interface ChatStore {
  model: string | null;
}

const chatStore = proxy<ChatStore>({
  model: null,
});
agent.model_name = chatStore.model;
export const useChatStore = () => useSnapshot(chatStore);

export async function setChatModel(model: string | null) {
  agent.model_name = model;
  chatStore.model = model;
}

export async function chat(userInput: string) {
  if (agent.messageContext.messages.every((x) => x.role !== "system")) {
    // agent.messageContext.upsert({ role: "system", content: systemPrompt, created_at: 0 });
  }

  agent.messageContext.upsert({ role: "user", content: userInput });
  await agent.chat();
}

import type { Message } from "@/types";
import { proxy, useSnapshot } from "valtio";
import { MessageContext } from "@/core";
import { agent } from "./Runtime";

interface MessageStore {
  messages: Record<string, Message>;
}

const messageStore = proxy<MessageStore>({
  messages: {},
});
agent.messageContext = new MessageContext(Object.values(messageStore.messages));
agent.messageContext.addListener(({ type, data }) => {
  if (type === "upsert") {
    messageStore.messages[data.id] = JSON.parse(JSON.stringify(data));
  } else if (type === "streaming") {
    const { id, key, chunk } = data;
    const msg = messageStore.messages[id];
    if (!msg) return;
    msg[key] = (msg[key] ?? "") + chunk;
  } else if (type === "delete") {
    const id = data;
    delete messageStore.messages[id];
  }
});

export const useMessageStore = () => useSnapshot(messageStore);

export async function clearMessages() {
  Object.keys(messageStore.messages).forEach((id) => {
    agent.messageContext.delete(id);
  });
}

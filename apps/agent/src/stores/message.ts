import type { Message } from "cc";
import { proxy, useSnapshot } from "valtio";

interface MessageStore {
  messages: Record<string, Message & { metadata: Message.Metadata }>;
}

export const messageStore = proxy<MessageStore>({
  messages: {},
});

// agent.messageContext.addListener(({ type, data }) => {
//   if (type === "upsert") {
//     messageStore.messages[data.id] = JSON.parse(JSON.stringify(data));
//   } else if (type === "streaming") {
//     const { id, key, chunk } = data;
//     const msg = messageStore.messages[id];
//     if (!msg) return;
//     msg[key] = (msg[key] ?? "") + chunk;
//   } else if (type === "delete") {
//     const id = data;
//     delete messageStore.messages[id];
//   }
// });

export const useMessageStore = () => useSnapshot(messageStore);

export async function clearMessages() {
  // Object.keys(messageStore.messages).forEach((id) => {
  //   agent.messageContext.delete(id);
  // });
}

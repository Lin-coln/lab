import cx, { type ClassValue } from "clsx";
import { useMessageStore } from "@/stores/message";
import { ChatMessage } from "@/components/ChatMessage";

export function ChatMessageView(props: { className?: ClassValue }) {
  const messageStore = useMessageStore();
  return (
    <div className={cx([props.className])}>
      {Object.values(messageStore.messages)
        .sort((a, b) => a.created_at - b.created_at)
        .map((message, i) => (
          <ChatMessage key={i} message={message} />
        ))}
    </div>
  );
}

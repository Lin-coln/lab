import cx, { type ClassValue } from "clsx";
import { useChatStore } from "@/stores/chat";
import { MessageItem, ReasoningItem, ToolCallItem } from "@/components/Item";

export function ChatMessageView(props: { className?: ClassValue }) {
  const chatStore = useChatStore();
  return (
    <div className={cx([props.className])}>
      {chatStore.items.map((item, i) => {
        if (item.type == "reasoning") {
          return <ReasoningItem key={i} item={item} />;
        } else if (item.type == "message") {
          return <MessageItem key={i} item={item} />;
        } else if (item.type == "tool_call") {
          return <ToolCallItem key={i} item={item} />;
        }
      })}
    </div>
  );
}

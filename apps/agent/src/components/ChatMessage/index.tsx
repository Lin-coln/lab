import type { Snapshot } from "valtio";
import type { Message } from "@/types";
import { ContentSection, ThinkingSection, ToolbarSection, ToolCallsSection } from "./sections.tsx";
import "./styles.css";
import { toDataAttrs } from "ui/utils/dataAttrs.ts";

export function ChatMessage(props: { message: Snapshot<Message> }) {
  const { message } = props;

  return (
    <div
      {...toDataAttrs({ component: "chat-message" })}
      onClick={() => {
        console.log(JSON.parse(JSON.stringify(message)));
      }}
    >
      {message.thinking && <ThinkingSection message={message} />}
      {message.tool_calls?.length && <ToolCallsSection message={message} />}
      {message.content && <ContentSection message={message} />}
      <ToolbarSection message={message} />
    </div>
  );
}

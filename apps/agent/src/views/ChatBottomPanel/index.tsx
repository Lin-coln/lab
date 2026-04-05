import { useRef, useState } from "react";
import { useViewStore } from "@/stores/view";
import { chat, useChatStore } from "@/stores/chat";
import { BottomLayer, BottomPanel } from "@/components/BottomPanel";
import { Textarea } from "ui";
import { ArrowUp } from "ui/icons";
import { ToolButton, ToolSection } from "./ToolSection";

export function ChatBottomPanel() {
  const viewStore = useViewStore();
  const isOpen = !viewStore.sidebar;

  const chatStore = useChatStore();
  const [input, setInput] = useState("阿姆斯特丹天气怎么样");
  const isSendButtonDisabled = Boolean(!chatStore.model || !input.length);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <BottomLayer open={isOpen}>
      <BottomPanel>
        <Textarea
          value={input}
          onValueChange={setInput}
          className={["pt-4 px-4", "w-full max-h-[480px] overflow-y-auto", "bg-transparent"]}
          style={{ boxShadow: void 0 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendButtonRef.current?.click();
            }
          }}
        />
        <ToolSection>
          <ToolButton
            ref={sendButtonRef}
            icon={<ArrowUp />}
            label={"send"}
            disabled={isSendButtonDisabled}
            variant={isSendButtonDisabled ? "standard" : "accent"}
            onClick={async () => {
              setInput("");
              await chat(input);
            }}
          />
        </ToolSection>
      </BottomPanel>
    </BottomLayer>
  );
}

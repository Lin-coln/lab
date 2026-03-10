import cx from "clsx";
import { type ReactNode } from "react";
import { openSidebar } from "@/stores/view.tsx";
import { Bell, Brain } from "ui/icons";
import { Button, type ButtonProps } from "ui";
import { clearMessages } from "@/stores/message.ts";
import { useChatStore } from "@/stores/chat.ts";

export function ToolSection(props: { children?: ReactNode }) {
  const chatStore = useChatStore();
  const modelLabel = chatStore.model ?? "none";

  const handleClear = async () => {
    await clearMessages();
  };
  return (
    <div className={cx("p-3", "flex flex-row items-center gap-2")}>
      <ToolButton
        icon={<Bell />}
        label={"messages"}
        onClick={() => {
          openSidebar("message");
        }}
      />
      <ToolButton
        icon={<Brain />}
        label={modelLabel}
        onClick={() => {
          openSidebar("models");
        }}
      />
      <span className={cx("ms-auto -me-2")} />
      <ToolButton label={"clear"} onClick={handleClear} />
      {props.children}
    </div>
  );
}

export function ToolButton(props: ButtonProps) {
  return <Button {...props} className={["rounded-full", props.className]} />;
}

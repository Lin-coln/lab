import cx from "clsx";
import { type ReactNode } from "react";
import { openSidebar } from "@/stores/view";
import { Bell, Brain } from "ui/icons";
import { Button, type ButtonProps } from "ui";
import { clearHistory, useChatStore } from "@/stores/chat";

export function ToolSection(props: { children?: ReactNode }) {
  const chatStore = useChatStore();
  const modelLabel = chatStore.model ?? "none";

  const handleClear = async () => {
    await clearHistory();
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

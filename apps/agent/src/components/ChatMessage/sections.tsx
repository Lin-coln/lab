import type { Snapshot } from "valtio";
import type { Message, ToolCall } from "@/types";
import cx from "clsx";
import { MarkdownRenderer } from "./markdown";
import { toDataAttrs } from "ui/utils/dataAttrs.ts";
import { Button, Tooltip } from "ui";
import { Copy, Refresh } from "ui/icons";

export function ThinkingSection(props: { message: Snapshot<Message> }) {
  return (
    <div {...toDataAttrs({ slot: "thinking" })} className={cx("mb-1")}>
      <div className="mb-1">thinking:</div>
      <div>{props.message.thinking}</div>
    </div>
  );
}

export function ToolCallsSection(props: { message: Snapshot<Message> }) {
  const renderCall = (x: ToolCall, i: number) => {
    return (
      <div
        key={i}
        className={cx(
          ["px-2 py-0 mb-1"],
          ["text-sm text-white/60"],
          ["max-w-full", "overflow-hidden", "text-wrap break-all"],
        )}
      >
        <span>{x.function.name}</span>
        <span className="ms-2">{JSON.stringify(x.function.arguments)}</span>
      </div>
    );
  };
  return (
    <div {...toDataAttrs({ slot: "tool_calls" })}>
      <div className="mb-1">tool calls:</div>
      {props.message.tool_calls?.map(renderCall)}
    </div>
  );
}

export function ContentSection(props: { message: Snapshot<Message> }) {
  const { message } = props;
  const { role } = message;
  return (
    <div
      className={cx(
        role === "user" ? "self-end" : "self-start",
        ["system", "assistant"].includes(role)
          ? ["bg-transparent", "px-2 py-0"]
          : [
              ["bg-[#ffffff19]", "px-4 py-3"],
              ["w-fit", "rounded-xl"],
            ],
        ["system"].includes(role)
          ? ["text-xs text-white/40"] // text
          : ["text-base text-white/80"],

        ["max-w-full", "overflow-hidden", "text-wrap break-all"],
      )}
    >
      <MarkdownRenderer content={message.content} />
    </div>
  );
}

export function ToolbarSection(props: { message: Snapshot<Message> }) {
  const { message } = props;

  const handleCopy = () => {
    console.log(message);
  };

  return (
    <div {...toDataAttrs({ slot: "toolbar" })}>
      <Tooltip content="copy">
        <Button className={["text-white/60"]} variant="subtle" size="small" icon={<Copy />} onClick={handleCopy} />
      </Tooltip>
      <Tooltip content="refresh">
        <Button className={["text-white/60"]} variant="subtle" size="small" icon={<Refresh />} onClick={handleCopy} />
      </Tooltip>
    </div>
  );
}

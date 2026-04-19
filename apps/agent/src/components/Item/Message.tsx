import { toDataAttrs } from "ui/utils/dataAttrs";
import type { Snapshot } from "valtio";
import type { Item } from "cc";
import { MarkdownRenderer } from "./markdown";
import { Button, Tooltip } from "ui";
import { Copy, Refresh } from "ui/icons";

export function MessageItem(props: { item: Snapshot<Extract<Item, { type: "message" }>> }) {
  const { item } = props;

  const isEmpty = !(
    typeof item.content === "string" ? item.content : item.content.map((x) => x.text).join("\n")
  ).replaceAll(/\n/g, "");

  if (isEmpty) return null;
  return (
    <div
      {...toDataAttrs({
        component: "history-item",
        type: "message",
        role: item.role,
      })}
      onClick={() => {
        console.log(JSON.parse(JSON.stringify(item)));
      }}
    >
      <div {...toDataAttrs({ slot: "content" })}>
        {typeof item.content === "string" ? (
          <MarkdownRenderer content={item.content} />
        ) : (
          item.content.map((x, i) => <MarkdownRenderer key={i} content={x.text} />)
        )}
      </div>
      <ToolbarSection item={item} />
    </div>
  );
}

function ToolbarSection(props: { item: Snapshot<Item> }) {
  const { item } = props;

  const handleCopy = () => {
    // console.log(item);
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

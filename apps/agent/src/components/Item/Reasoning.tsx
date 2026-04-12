import { toDataAttrs } from "ui/utils/dataAttrs";
import type { Snapshot } from "valtio";
import type { Item } from "cc";
import { MarkdownRenderer } from "./markdown";

export function ReasoningItem(props: { item: Snapshot<Extract<Item, { type: "reasoning" }>> }) {
  const { item } = props;
  return (
    <div
      {...toDataAttrs({
        component: "history-item",
        type: "reasoning",
      })}
      onClick={() => {
        console.log(JSON.parse(JSON.stringify(item)));
      }}
    >
      <div className="mb-1">reasoning:</div>
      {item.content.map((x, i) => (
        <MarkdownRenderer key={i} content={x.text} />
      ))}
    </div>
  );
}

import { toDataAttrs } from "ui/utils/dataAttrs";
import type { Snapshot } from "valtio";
import type { Item } from "cc";

export function ToolCallItem(props: { item: Snapshot<Extract<Item, { type: "tool_call" }>> }) {
  const { item } = props;
  return (
    <div
      {...toDataAttrs({
        component: "history-item",
        type: "tool_call",
      })}
      onClick={() => {
        console.log(JSON.parse(JSON.stringify(item)));
      }}
    >
      <span>
        {item.name}@{item.call_id}
      </span>
      <span className="ms-2">{JSON.stringify(item.arguments)}</span>
    </div>
  );
}

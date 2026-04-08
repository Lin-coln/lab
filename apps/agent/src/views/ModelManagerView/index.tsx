import cx, { type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { ModelItem } from "./ModelItem";
import { listModel } from "@/stores/model";
import type { ModelInfo } from "cc/legacy";
import { setChatModel, useChatStore } from "@/stores/chat";

export function ModelManagerView(props: { className?: ClassValue }) {
  const [list, setList] = useState<ModelInfo[]>([]);
  useEffect(() => {
    listModel().then((models) => {
      setList(models);
    });
  }, []);

  const chatStore = useChatStore();
  const selected = chatStore.model;
  const handleClick = async (model: ModelInfo) => {
    await setChatModel(selected === model.identifier ? null : model.identifier);
  };

  return (
    <div className={cx([props.className])}>
      {list.map((x, i) => (
        <ModelItem key={i} model={x} isSelected={selected === x.identifier} onClick={handleClick} />
      ))}
    </div>
  );
}

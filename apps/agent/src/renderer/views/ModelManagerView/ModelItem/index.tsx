import cx from "clsx";
import type { ModelInfo } from "@/stores/model.ts";

export function ModelItem(props: { model: ModelInfo; isSelected: boolean; onClick: (model: ModelInfo) => void }) {
  const { model, isSelected, onClick } = props;
  return (
    <div
      className={cx(
        "whitespace-pre-wrap",
        "w-full overflow-hidden text-wrap break-all", //
        "rounded-xl",
        "px-4 py-4",
        "flex flex-col",
        "mb-2",
        "cursor-pointer",
        isSelected
          ? ["bg-[#ffffff19]", "ring-1 ring-[#ffffff29]"]
          : ["bg-[#ffffff09]", "hover:ring-1 ring-[#ffffff19]"],
      )}
      onClick={() => onClick(model)}
    >
      <div className={cx("flex flex-row items-center gap-1", "mb-1")}>
        <div className={cx("text-base", "flex flex-row items-center")}>
          <div>{model.identifier}</div>
          {isSelected && (
            <div className={cx("rounded-full size-2", "relative", "ms-2", "bg-green-500")}>
              <div className={cx("rounded-full size-full", "absolute", "bg-green-400 animate-ping")} />
            </div>
          )}
        </div>
        {model.capabilities.map((x, i) => (
          <div
            key={i}
            className={cx("text-xs opacity-60", "bg-[#ffffff19] px-1 py-0.5 rounded-sm", i == 0 && "ms-auto")}
          >
            {x}
          </div>
        ))}
      </div>
      <div className={cx("text-xs opacity-60", "flex flex-row justify-between")}>
        <span>{formatBytes(model.size)}</span>
        <span>{model.parameter_size}</span>
        <span>{model.format}</span>
        <span>{model.quantization_level}</span>
        <span>{new Date(model.modified_at).toISOString().slice(0, -8)}</span>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${parseFloat(value.toFixed(2))} ${sizes[i]}`;
}

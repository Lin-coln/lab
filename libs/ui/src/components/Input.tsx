import type { ChangeEvent } from "react";
import cx, { type ClassValue } from "clsx";

export function Input(props: { className?: ClassValue; value: string; onValueChange: (value: string) => void }) {
  const { value, onValueChange } = props;
  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.currentTarget.value);
  };
  return (
    <input
      className={cx(props.className, [
        "rounded-md",
        "outline-none",
        "w-52 h-8 py-1 px-2",
        "bg-[#ffffff0f] hover:bg-[#ffffff19]",
        "[--stroke-color:#ffffff0a] hover:[--stroke-color:#ffffff19] focus:[--stroke-color:#ffffffea]",
      ])}
      style={{
        boxShadow: "inset 0 0 0 1px var(--stroke-color)",
      }}
      type="text"
      value={value}
      onChange={handleValueChange}
    />
  );
}

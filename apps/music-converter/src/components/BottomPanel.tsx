import type { ReactNode } from "react";
import cx, { type ClassValue } from "clsx";

export function BottomPanel(props: { className?: ClassValue; children?: ReactNode }) {
  return (
    <BottomPresence>
      <div
        className={cx(
          props.className,
          "bg-neutral-400/5 backdrop-blur-2xl",
          // "bg-[#29292b99] backdrop-blur-2xl",
          "flex flex-col",
          "[--stroke-color:#ffffff0a] hover:[--stroke-color:#ffffff19] focus:[--stroke-color:#ffffffea]",
        )}
        style={{
          boxShadow: [
            `inset 0 0 0 1px var(--stroke-color)`,
            // shadow
            `0 10px 15px -3px rgb(0 0 0 / 0.1)`,
            `0 4px 6px -4px rgb(0 0 0 / 0.1)`,
          ].join(", "),
        }}
      >
        {props.children}
      </div>
    </BottomPresence>
  );
}

export function BottomPresence(props: { className?: ClassValue; children?: ReactNode }) {
  return (
    <div className={cx(props.className, "sticky bottom-0 z-10 left-0 right-0 overflow-hidden")}>{props.children}</div>
  );
}

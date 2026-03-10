import cx, { type ClassValue } from "clsx";
import type { CSSProperties, ReactNode, Ref } from "react";

export function BasePanel(props: {
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  className?: ClassValue;
  children: ReactNode;
}) {
  return (
    <div
      ref={props.ref}
      className={cx([
        props.className,
        "bg-[#29292b99] backdrop-blur-2xl",
        "flex flex-col",
        "[--stroke-color:#ffffff0a] hover:[--stroke-color:#ffffff19] focus:[--stroke-color:#ffffffea]",
      ])}
      style={{
        boxShadow: [
          `inset 0 0 0 1px var(--stroke-color)`,
          // shadow
          `0 10px 15px -3px rgb(0 0 0 / 0.1)`,
          `0 4px 6px -4px rgb(0 0 0 / 0.1)`,
        ].join(", "),
        ...(props.style ?? {}),
      }}
    >
      {props.children}
    </div>
  );
}

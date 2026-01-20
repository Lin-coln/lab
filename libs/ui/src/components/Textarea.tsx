import cx, { type ClassValue } from "clsx";
import { type Ref, type KeyboardEvent, useRef, type TextareaHTMLAttributes, useState, type CSSProperties } from "react";
import { useForkRef } from "../utils/refs.ts";

Textarea.Base = Base;

export function Textarea(props: {
  className?: ClassValue;
  style?: CSSProperties;
  value: string;
  onValueChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div
      ref={useForkRef(divRef)}
      data-focused={focused ? "" : void 0}
      className={cx(props.className, [
        "flex flex-col",
        "bg-[#29292b99]",
        "px-2.5 py-2 rounded-md",
        "[--stroke-color:#ffffff0a] hover:[--stroke-color:#ffffff19] data-[focused]:[--stroke-color:#ffffffea]",
      ])}
      spellCheck={false}
      style={{
        boxShadow: [
          `inset 0 0 0 1px var(--stroke-color)`,
          // shadow
          `0 10px 15px -3px rgb(0 0 0 / 0.1)`,
          `0 4px 6px -4px rgb(0 0 0 / 0.1)`,
        ].join(", "),
        ...props.style,
      }}
    >
      <Base
        className={cx()}
        onKeyDown={props.onKeyDown}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        ref={useForkRef(textareaRef)}
        value={props.value}
        onChange={(e) => {
          props.onValueChange(e.target.value);
        }}
      />
    </div>
  );
}

function Base(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & {
    ref?: Ref<HTMLTextAreaElement>;
  },
) {
  const { ref, ...rest } = props;
  const updateHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  return (
    <textarea
      ref={useForkRef(updateHeight, ref)}
      onDragStart={(e) => e.preventDefault()}
      {...rest}
      className={cx(
        "w-full h-full text-base outline-none resize-none",
        "selection:bg-white/85 selection:text-black",
        rest.className,
      )}
      onKeyDown={(e) => {
        if (rest.onKeyDown) rest.onKeyDown(e);

        if (e.key !== "Enter") return;
        if (!e.shiftKey) return;
        e.preventDefault();
        const el = e.currentTarget;
        const { selectionStart, selectionEnd, value } = el;
        el.value = value.slice(0, selectionStart) + "\n" + value.slice(selectionEnd);
        el.selectionStart = el.selectionEnd = selectionStart + 1;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }}
    />
  );
}

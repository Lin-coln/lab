import "./style.css";
import type { CSSProperties, Ref } from "react";
import cx, { type ClassValue } from "clsx";
import { toDataAttrs } from "../../utils/dataAttrs";

export interface InputProps {
  ref?: Ref<HTMLInputElement>;
  className?: ClassValue;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  style?: CSSProperties;
}

export function Input(props: InputProps) {
  const { disabled = false } = props;

  return (
    <input
      ref={props.ref}
      disabled={disabled}
      {...toDataAttrs({
        component: "input",
        disabled,
      })}
      style={props.style}
      className={cx([props.className])}
      type="text"
      value={props.value}
      onChange={(e) => {
        if (!disabled) {
          props.onValueChange(e.currentTarget.value);
        }
      }}
    />
  );
}

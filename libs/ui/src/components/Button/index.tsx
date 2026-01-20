import { type ReactNode, type Ref, type MouseEvent, isValidElement, cloneElement } from "react";
import cx, { type ClassValue } from "clsx";
import "./style.css";
import { toDataAttrs } from "../../utils/dataAttrs.ts";

export interface ButtonProps {
  ref?: Ref<HTMLButtonElement>;
  className?: ClassValue;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "standard" | "subtle" | "accent";
  size?: "small" | "medium" | "large";
}

export function Button(props: ButtonProps) {
  const { disabled = false, variant = "standard", size = "medium" } = props;

  const labelNode = !props.label ? null : isValidElement(props.label) ? props.label : <span>{props.label}</span>;

  return (
    <button
      ref={props.ref}
      disabled={disabled}
      {...toDataAttrs({
        component: "button",
        disabled,
        variant,
        size,
      })}
      onClick={(e) => {
        if (!disabled) {
          props.onClick?.(e);
        }
      }}
      className={cx([props.className])}
    >
      {props.icon}
      {labelNode &&
        cloneElement(labelNode, {
          ...toDataAttrs({ slot: "label" }),
          ...(labelNode.props ?? {}),
        })}
    </button>
  );
}

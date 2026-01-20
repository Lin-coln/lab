import { cloneElement, type ReactElement } from "react";
import { Button, type ButtonProps } from "../Button";
import { usePopoverContext } from "./context.tsx";
import { useForkRef } from "../../utils/refs.ts";

export type PopoverTriggerProps = (ButtonProps & { as: "Button" }) | { children: ReactElement };

export function PopoverTrigger(props: PopoverTriggerProps) {
  if ("as" in props) {
    const { as, ...rest } = props;
    return (
      <Trigger>
        <Button {...rest} />
      </Trigger>
    );
  }

  const children = "children" in props ? props.children : null;
  if (children) return <Trigger children={children} />;

  return null;
}

function Trigger(props: { children: ReactElement }) {
  const { children } = props;
  const ctx = usePopoverContext();

  const childrenRef = (children as any).ref;
  const setRef = useForkRef(ctx.refs.setReference, childrenRef);
  return cloneElement(
    children,
    ctx.getReferenceProps({
      ref: setRef as any,
      ...(children.props ?? {}),
      // data-state
    }),
  );
}

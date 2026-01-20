import { cloneElement, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from "react";
import { FloatingFocusManager, FloatingPortal } from "@floating-ui/react";
import { usePopoverContext } from "./context.tsx";
import cx, { type ClassValue } from "clsx";
import "./styles.css";
import { useForkRef } from "../../utils/refs.ts";
import { toDataAttrs } from "../../utils/dataAttrs.ts";

export type PopoverContentProps = (DefaultPanelProps & { as: "panel" }) | { children: ReactElement };

export function PopoverContent(props: PopoverContentProps) {
  if ("as" in props) {
    const { as, ...rest } = props;
    return (
      <Content>
        <DefaultPanel {...rest} />
      </Content>
    );
  }

  const children = "children" in props ? props.children : null;
  if (children) return <Content children={children} />;

  return null;
}

function Content(props: { children: ReactElement }) {
  const { children } = props;
  const ctx = usePopoverContext();
  const childrenRef = (children as any).ref;
  const setRef = useForkRef(ctx.refs.setFloating, childrenRef);
  if (!ctx.context.open) return null;

  const contentNode = cloneElement(children as any, {
    ...(children.props ?? {}),
    ref: setRef as any,
    style: {
      ...ctx.floatingStyles,
      ...((children.props as any)?.style ?? {}),
    },
    ...ctx.getFloatingProps(),
  });
  return (
    <FloatingPortal>
      <FloatingFocusManager context={ctx.context} modal={ctx.modal}>
        {contentNode}
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

type DefaultPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "as" | "className"> & {
  ref?: Ref<HTMLDivElement>;
  className?: ClassValue;
  children: ReactNode;
};

function DefaultPanel(props: DefaultPanelProps) {
  const { ref, className, children, ...rest } = props;
  return (
    <div {...toDataAttrs({ component: "popover-panel" })} {...rest} ref={ref} className={cx(className)}>
      {children}
    </div>
  );
}

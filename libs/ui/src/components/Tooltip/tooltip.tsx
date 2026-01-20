import { cloneElement, type ReactElement, type ReactNode, useMemo, useState } from "react";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type Placement,
  useHover,
  FloatingPortal,
} from "@floating-ui/react";
import { useForkRef } from "../../utils/refs.ts";
import { toDataAttrs } from "../../utils/dataAttrs.ts";
import "./styles.css";

export interface TooltipProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  placement?: Placement;
  children: ReactElement;
  content: ReactNode;
}

export function Tooltip(props: TooltipProps) {
  const { open: _open, setOpen: _setOpen, placement = "top", children, content: _content, ...restProps } = props;
  const [internalOpen, setInternalOpen] = useState(_open ?? false);
  const open = _open ?? internalOpen;
  const setOpen = _setOpen ?? setInternalOpen;

  const data = useFloating({
    placement,
    open: open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({
        crossAxis: placement.includes("-"),
        fallbackAxisSideDirection: "start",
        padding: 10,
      }),
      shift({ padding: 10 }),
    ],
  });
  const hover = useHover(data.context, { move: false });
  const dismiss = useDismiss(data.context);
  const role = useRole(data.context);
  const interactions = useInteractions([hover, dismiss, role]);

  const ctx = useMemo(
    () => ({
      ...interactions,
      ...data,
      open,
      setOpen,
    }),
    [interactions, data, open, setOpen],
  );

  // trigger node
  const childrenRef = (children as any).ref;
  const setTriggerRef: any = useForkRef(ctx.refs.setReference, childrenRef);
  const triggerNode = cloneElement(
    children,
    ctx.getReferenceProps({
      ref: setTriggerRef,
      ...restProps,
      ...(children.props ?? {}),
      // data-state
    }),
  );

  // content node
  const content = <div {...toDataAttrs({ component: "tooltip-panel" })}>{_content}</div>;
  const contentRef = (content as any).ref;
  const setContentRef = useForkRef(ctx.refs.setFloating, contentRef);
  const contentNode = !ctx.context.open
    ? null
    : cloneElement(content as any, {
        ...(content.props ?? {}),
        ref: setContentRef,
        style: {
          ...ctx.floatingStyles,
          ...((content.props as any)?.style ?? {}),
        },
        ...ctx.getFloatingProps(),
      });

  return (
    <>
      {triggerNode}
      {!contentNode ? null : <FloatingPortal>{contentNode}</FloatingPortal>}
    </>
  );
}

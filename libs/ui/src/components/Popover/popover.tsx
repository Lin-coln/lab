import { type ReactNode, useMemo, useState } from "react";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type Placement,
} from "@floating-ui/react";
import { Context, type PopoverContext } from "./context.tsx";

export interface PopoverProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  placement?: Placement;
  modal?: boolean;
  children: ReactNode;
}

export function Popover(props: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(props.open ?? false);
  const open = props.open ?? internalOpen;
  const setOpen = props.setOpen ?? setInternalOpen;
  const placement = props.placement ?? "bottom";
  const modal = props.modal ?? false;

  const data = useFloating({
    placement,
    open: open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({
        crossAxis: placement.includes("-"),
        fallbackAxisSideDirection: "end",
        padding: 10,
      }),
      shift({ padding: 10 }),
    ],
  });
  const click = useClick(data.context);
  const dismiss = useDismiss(data.context);
  const role = useRole(data.context);
  const interactions = useInteractions([click, dismiss, role]);

  const ctx: PopoverContext = useMemo(
    () => ({
      ...interactions,
      ...data,
      open,
      setOpen,
      modal,
    }),
    [interactions, data, open, setOpen, modal],
  );
  return <Context.Provider value={ctx}>{props.children}</Context.Provider>;
}

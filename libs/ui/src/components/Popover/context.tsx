import type { UseFloatingReturn, UseInteractionsReturn } from "@floating-ui/react";
import { createContext, useContext } from "react";

export interface PopoverContext extends UseInteractionsReturn, UseFloatingReturn {
  open: boolean;
  setOpen: (open: boolean) => void;
  modal: boolean;
}

export const Context = createContext<PopoverContext | null>(null);

export function usePopoverContext() {
  const ctx = useContext(Context);
  if (ctx == null) {
    throw new Error(`Popover components must be wrapped in <Popover />`);
  }
  return ctx;
}

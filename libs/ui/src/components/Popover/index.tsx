import { Popover } from "./popover";
import { PopoverContent } from "./content";
import { PopoverTrigger } from "./trigger";

export { type PopoverContext, usePopoverContext } from "./context";
export type { PopoverProps } from "./popover";
export type { PopoverTriggerProps } from "./trigger";
export type { PopoverContentProps } from "./content";

const PopoverFinal = Object.assign(Popover, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});
export { PopoverFinal as Popover };

import { Popover } from "./popover.tsx";
import { PopoverContent } from "./content.tsx";
import { PopoverTrigger } from "./trigger.tsx";

export { type PopoverContext, usePopoverContext } from "./context.tsx";
export type { PopoverProps } from "./popover.tsx";
export type { PopoverTriggerProps } from "./trigger.tsx";
export type { PopoverContentProps } from "./content.tsx";

const PopoverFinal = Object.assign(Popover, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});
export { PopoverFinal as Popover };

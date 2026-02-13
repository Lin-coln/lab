import cx from "clsx";
import { IoMdMusicalNote } from "react-icons/io";
import { type ReactNode, useState } from "react";
import { Popover } from "ui";

export function Header(props: { menu: ReactNode; actions: ReactNode }) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div
      className={cx(
        "app-region-drag",
        "fixed top-0 left-0 w-full h-16",
        "flex flex-row items-center",
        "pointer-events-none *:pointer-events-auto",
        "pl-safe-area pr-safe-area",
      )}
    >
      <Popover open={openMenu} setOpen={(open) => setOpenMenu(open)} placement="bottom">
        <Popover.Trigger>
          <div
            className={cx(
              "relative",
              "rounded-md p-1",
              "flex flex-row items-center",
              "text-neutral-50/10",
              "hover:bg-neutral-50/5 hover:text-neutral-50/30 transition-colors",
              "aria-expanded:bg-neutral-50/5 aria-expanded:text-neutral-50/30",
            )}
          >
            <IoMdMusicalNote className="translate-x-1.5 -rotate-12 -ms-1.5" size={24} />
            <div className={cx("text-base font-bold me-2")}>Converter</div>
          </div>
        </Popover.Trigger>
        <Popover.Content as="panel" className="w-56 rounded-lg">
          {props.menu}
        </Popover.Content>
      </Popover>

      <div className={cx("app-region-drag", "ms-auto", "flex flex-row items-center self-stretch")}>{props.actions}</div>
    </div>
  );
}

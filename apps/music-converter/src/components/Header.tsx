import cx from "clsx";
import { IoMdMusicalNote } from "react-icons/io";
import type { ReactNode } from "react";

export function Header(props: { actions: ReactNode }) {
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
      <div
        className={cx(
          "relative",
          "rounded-md p-1",
          "flex flex-row items-center",
          "text-neutral-50/10",
          "hover:bg-neutral-50/5 hover:text-neutral-50/30 transition-colors",
        )}
      >
        <IoMdMusicalNote className="translate-x-1.5 -rotate-12 -ms-1.5" size={24} />
        <div className={cx("text-base font-bold me-2")}>Converter</div>
      </div>

      <div className={cx("app-region-drag", "ms-auto", "flex flex-row items-center self-stretch")}>{props.actions}</div>
    </div>
  );
}

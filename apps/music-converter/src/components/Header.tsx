import cx from "clsx";
import { IoMdMusicalNote } from "react-icons/io";
import type { ReactNode } from "react";

export function Header(props: { actions: ReactNode }) {
  return (
    <div
      className={cx(
        "fixed top-0 left-0 w-full",
        "flex flex-row items-center",
        "pointer-events-none *:pointer-events-auto",
      )}
    >
      <div
        className={cx(
          "ms-4 my-4 ", // ...
          "relative",
          "text-neutral-50/10",
          "flex flex-row items-center",
          "rounded-2xl p-2",
          "hover:bg-neutral-50/5 hover:text-neutral-50/30 transition-colors",
        )}
      >
        <IoMdMusicalNote className="-translate-y-px translate-x-1.5 -rotate-12 -ms-2" size={28} />
        <div className={cx("text-lg font-bold me-2")}>Converter</div>
      </div>

      <div className={cx("ms-auto me-4", "flex flex-row items-center self-stretch")}>
        {props.actions}
        {/*<Button*/}
        {/*  variant="subtle"*/}
        {/*  icon={<BsGithub size={24} />}*/}
        {/*  className={["size-12", "text-neutral-50/30 rounded-full", "hover:text-neutral-50/60 transition-colors"]}*/}
        {/*  onClick={() => {*/}
        {/*    // ...*/}
        {/*  }}*/}
        {/*/>*/}
        {/*<Button*/}
        {/*  variant="subtle"*/}
        {/*  icon={<BsList size={24} />}*/}
        {/*  className={["size-12", "text-neutral-50/30 rounded-full", "hover:text-neutral-50/60 transition-colors"]}*/}
        {/*  onClick={() => {*/}
        {/*    // ...*/}
        {/*  }}*/}
        {/*/>*/}
      </div>
    </div>
  );
}

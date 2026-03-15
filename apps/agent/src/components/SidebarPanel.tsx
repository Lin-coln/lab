import type { ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import cx from "clsx";
import { BasePanel } from "./common.tsx";
import { Button } from "ui";
import { XMark } from "ui/icons";

export function SidebarPanel(props: { title: string; onClose: () => unknown; children: ReactNode }) {
  return (
    <BasePanel className={["rounded-2xl h-full w-[400px] overflow-hidden", "pointer-events-auto"]}>
      <div className={cx("px-4 pb-4 pt-4", "flex flex-row items-center")}>
        <div className={cx("text-xl ms-2")}>{props.title}</div>
        <Button
          variant="subtle"
          size="large"
          className={["rounded-xl", "ms-auto"]}
          icon={<XMark />}
          onClick={() => props.onClose()}
        />
      </div>
      <div className={cx("px-4 py-2", "h-full overflow-y-auto")}>{props.children}</div>
    </BasePanel>
  );
}

export function SidebarLayer(props: { open: boolean; side: "right" | "left"; children: ReactNode }) {
  const sidebarVariants = {
    hidden: {
      x: { left: "-100%", right: "100%" }[props.side],
    },
    visible: { x: 0 },
  };
  const transition: Transition = {
    type: "tween",
    duration: 0.3,
    // ease: [0.3, 1.3, 0.3, 1],
    ease: [0.5, 0.16, 0.16, 1],
  };

  return (
    <AnimatePresence mode="wait">
      {props.open && (
        <motion.div
          className={cx([
            "fixed z-10 top-0",
            { left: "left-0", right: "right-0" }[props.side],
            "h-full p-6",
            "overscroll-none",
            "pointer-events-none",
            // margin for windows title bar overlay
            "app-region-drag pt-safe-area",
          ])}
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={transition}
        >
          {props.children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

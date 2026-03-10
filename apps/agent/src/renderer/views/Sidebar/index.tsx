import cx from "clsx";
import type { ReactNode } from "react";
import { Button } from "ui";
import { XMark } from "ui/icons";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { BasePanel } from "@/views/common/BasePanel.tsx";
import { closeSidebar, useViewStore } from "@/stores/view.tsx";

export function Sidebar() {
  const viewStore = useViewStore();
  const sidebar = viewStore.sidebar;

  const Component = sidebar ? sidebar.component : () => null;
  return (
    <SidebarPanel>
      <div className={cx("px-4 pb-4 pt-4", "flex flex-row items-center")}>
        <div className={cx("text-xl ms-2")}>{sidebar?.title}</div>
        <Button
          variant="subtle"
          size="large"
          className={["rounded-xl", "ms-auto"]}
          icon={<XMark />}
          onClick={() => closeSidebar()}
        />
      </div>
      <div className={cx("px-4 py-2", "h-full overflow-y-auto")}>
        <Component />
      </div>
    </SidebarPanel>
  );
}

function SidebarPanel(props: { children: ReactNode }) {
  const viewStore = useViewStore();
  const isOpen = viewStore.sidebar;

  const side: "right" | "left" = "left";
  const sidebarVariants = {
    hidden: {
      x: { left: "-100%", right: "100%" }[side],
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
      {isOpen && (
        <motion.div
          className={cx([
            "fixed z-10 top-0",
            { left: "left-0", right: "right-0" }[side],
            "h-full p-6",
            "overscroll-none",
            "pointer-events-none",
            "app-drag pt-12", // margin for windows title bar overlay
          ])}
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={transition}
        >
          <BasePanel className={["rounded-2xl h-full w-[400px] overflow-hidden", "pointer-events-auto"]}>
            {props.children}
          </BasePanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

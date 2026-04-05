import cx from "clsx";
import { type ReactNode, useRef } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { BasePanel } from "./common";

export function BottomPanel(props: { children: ReactNode }) {
  return (
    <BasePanel
      className={[
        "max-w-[768px] mx-auto",
        "w-full",
        "rounded-3xl overflow-hidden",
        "m-6", // sticky animation cannot use padding
      ]}
    >
      {props.children}
    </BasePanel>
  );
}

export function BottomLayer(props: { open: boolean; children: ReactNode }) {
  const shouldScrollToBottomRef = useRef(false);
  const bottomPanelVariants = {
    hidden: { height: 0 },
    visible: { height: "auto" },
  };
  const transition: Transition = {
    type: "tween",
    duration: 0.3,
    // ease: [0.3, 1.3, 0.3, 1],
    ease: [0.5, 0.16, 0.16, 1],
  };

  return (
    <AnimatePresence initial={false}>
      {props.open && (
        <motion.div
          className={cx("sticky bottom-0 z-10 left-0 right-0 overflow-hidden")}
          variants={bottomPanelVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={transition}
          onAnimationStart={(def) => {
            if (def === "visible") {
              shouldScrollToBottomRef.current = isWindowScrolledToBottom();
            }
          }}
          onUpdate={() => {
            if (shouldScrollToBottomRef.current) {
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "instant",
              });
            }
          }}
          onAnimationComplete={(def) => {
            if (def === "visible") {
              shouldScrollToBottomRef.current = false;
            }
          }}
        >
          {props.children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function isWindowScrolledToBottom(offset = 0) {
  const scrollTop = window.scrollY || window.pageYOffset;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  return scrollTop + windowHeight >= docHeight - offset;
}

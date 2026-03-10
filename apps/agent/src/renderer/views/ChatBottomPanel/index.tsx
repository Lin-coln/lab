import cx, { type ClassValue } from "clsx";
import { type ReactNode, useRef, useState } from "react";
import { useViewStore } from "@/stores/view.tsx";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { ToolSection, ToolButton } from "./ToolSection.tsx";
import { Textarea } from "ui";
import { ArrowUp } from "ui/icons";
import { BasePanel } from "@/views/common/BasePanel.tsx";
import { chat, useChatStore } from "@/stores/chat.ts";

export function ChatBottomPanel(props: { className?: ClassValue }) {
  const chatStore = useChatStore();
  const [input, setInput] = useState("阿姆斯特丹天气怎么样");
  const isSendButtonDisabled = Boolean(!chatStore.model || !input.length);

  const sendButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <BottomPanel
      className={cx(
        props.className,
        "rounded-3xl overflow-hidden",
        "m-6", // sticky animation cannot use padding
      )}
    >
      <Textarea
        value={input}
        onValueChange={setInput}
        className={["pt-4 px-4", "w-full max-h-[480px] overflow-y-auto", "bg-transparent"]}
        style={{ boxShadow: void 0 }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !Boolean(e.shiftKey)) {
            e.preventDefault();
            sendButtonRef.current?.click();
          }
        }}
      />
      <ToolSection>
        <ToolButton
          ref={sendButtonRef}
          icon={<ArrowUp />}
          label={"send"}
          disabled={isSendButtonDisabled}
          variant={isSendButtonDisabled ? "standard" : "accent"}
          onClick={async () => {
            setInput("");
            await chat(input);
          }}
        />
      </ToolSection>
    </BottomPanel>
  );
}

function BottomPanel(props: { className?: ClassValue; children: ReactNode }) {
  const viewStore = useViewStore();
  const isOpen = !viewStore.sidebar;
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

  const shouldScrollToBottomRef = useRef(false);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
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
          <BasePanel className={cx(props.className)}>{props.children}</BasePanel>
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

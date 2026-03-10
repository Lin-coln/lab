import { Sidebar } from "@/views/Sidebar";
import { ChatBottomPanel } from "@/views/ChatBottomPanel";
import { ChatMessageView } from "@/views/ChatMessageView";
import cx from "clsx";
import { useEffect } from "react";
import { useMessageStore } from "@/stores/message.ts";

export default function App() {
  const messageStore = useMessageStore();
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [messageStore.messages]);

  return (
    <>
      <div
        className={cx(
          "flex flex-col w-full min-h-screen justify-end",
          "app-drag", // allow drag app window for electron
        )}
      >
        <ChatMessageView className={["max-w-[768px] mx-auto", "mt-8 mb-8", "w-full"]} />
        <ChatBottomPanel className={["max-w-[768px] mx-auto", "w-full"]} />
      </div>
      <Sidebar />
    </>
  );
}

import { ChatMessageView } from "@/views/ChatMessageView";
import cx from "clsx";
import { useEffect } from "react";
import { closeSidebar, useViewStore } from "@/stores/view";
import { SidebarLayer, SidebarPanel } from "@/components/SidebarPanel";
import { ChatBottomPanel } from "@/views/ChatBottomPanel";
import { useChatStore } from "@/stores/chat";

export default function App() {
  const chatStore = useChatStore();
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [chatStore.items]);

  return (
    <>
      <div
        className={cx(
          "flex flex-col w-full min-h-screen justify-end",
          "app-drag", // allow drag app window for electron
        )}
      >
        <ChatMessageView className={["max-w-[768px] mx-auto", "mt-8 mb-8", "w-full"]} />
        <ChatBottomPanel />
      </div>
      <Sidebar />
    </>
  );
}

function Sidebar() {
  const viewStore = useViewStore();
  const sidebar = viewStore.sidebar;
  const Component: any = sidebar ? sidebar.component : () => null;
  return (
    <SidebarLayer side="left" open={!!sidebar}>
      <SidebarPanel title={sidebar?.title ?? "untitled"} onClose={closeSidebar}>
        <Component />
      </SidebarPanel>
    </SidebarLayer>
  );
}

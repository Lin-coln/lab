import { proxy, useSnapshot } from "valtio";
import type { ComponentType, LazyExoticComponent } from "react";
import { ChatMessageView } from "@/views/ChatMessageView";
import { ModelManagerView } from "@/views/ModelManagerView";

type Component = LazyExoticComponent<ComponentType> | ComponentType;
type SidebarConfig =
  | { key: "message"; title: "Message"; component: Component }
  | { key: "models"; title: "Models"; component: Component };

interface ViewStore {
  sidebar: null | SidebarConfig;
}

const configs = getSidebarConfigs();
export const viewStore = proxy<ViewStore>({
  sidebar: null,
});

export const useViewStore = () => useSnapshot(viewStore);

export function openSidebar(key: SidebarConfig["key"]) {
  const cfg = configs.find((cfg) => cfg.key === key);
  viewStore.sidebar = cfg ?? null;
}
export function closeSidebar() {
  viewStore.sidebar = null;
}

function getSidebarConfigs(): SidebarConfig[] {
  return [
    {
      key: "message",
      title: "Message",
      component: () => <ChatMessageView className={["w-full"]} />,
    },
    {
      key: "models",
      title: "Models",
      component: () => <ModelManagerView className={["w-full"]} />,
    },
  ];
}

export function createHub() {
  const listeners = new Set<() => void>();
  let detachBrowserListener: (() => void) | null = null;

  return {
    notify,
    subscribe,
  };

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.addEventListener("popstate", notify);
      detachBrowserListener = () => window.removeEventListener("popstate", notify);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && detachBrowserListener) {
        detachBrowserListener();
        detachBrowserListener = null;
      }
    };
  }
}

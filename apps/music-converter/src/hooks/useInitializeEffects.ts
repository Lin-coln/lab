import { useEffect, useLayoutEffect, useRef } from "react";

export function useInitializeEffects() {
  usePreventScale();
  useFixedViewPort();
}

function usePreventScale() {
  const lastTouchEndRef = useRef<number>(0);

  useEffect(() => {
    const el = document.documentElement;
    el.addEventListener("touchstart", handleTouchStart);
    el.addEventListener("touchend", handleTouchEnd, false);
    // safari only
    el.addEventListener("gesturestart", handleGestureStart);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd, false);
      el.removeEventListener("gesturestart", handleGestureStart);
    };

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length <= 1) return;
      event.preventDefault();
    }
    function handleTouchEnd(event: TouchEvent) {
      let now = new Date().getTime();
      if (now - lastTouchEndRef.current <= 300) {
        // double click to scale screen
        event.preventDefault();
      } else {
        lastTouchEndRef.current = now;
      }
    }
    function handleGestureStart(event: Event) {
      event.preventDefault();
    }
  }, []);
}

function useFixedViewPort() {
  useLayoutEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
    function handleResize() {
      const el = document.body;
      el.style.setProperty(`--viewport-height`, getViewportHeight());
    }
    function getViewportHeight() {
      const height = window.innerHeight;
      // const width = window.innerWidth;
      // return width >= height ? '100vh' : `${height}px`
      return `${height}px`;
    }
  }, []);
}

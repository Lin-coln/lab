import { useMemo, type Ref, type RefCallback } from "react";

export function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref != null) {
    ref.current = value;
  }
}

export function useForkRef<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> | null {
  return useMemo(() => {
    if (refs.every((ref) => ref == null)) {
      return null;
    }
    return (value: T | null) => {
      refs.forEach((ref) => setRef(ref, value));
    };
  }, refs);
}

import { describe, it, expect, mock } from "bun:test";
import { createAPI, createDispose } from "./sokii";
import { merged as mergedFn } from "./merge.ts";

describe("preset ctx", () => {
  it("should register and dispose callbacks", () => {
    const s1 = createDispose();
    const fn1 = mock(() => void 0);
    const fn2 = mock(() => void 0);

    s1.onDispose(fn1);
    s1.onDispose(fn2);
    s1.dispose();
    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(1);

    // callbacks should be cleared
    fn1.mockClear();
    fn2.mockClear();
    s1.dispose();
    expect(fn1).toBeCalledTimes(0);
    expect(fn2).toBeCalledTimes(0);

    // unsubscribe should prevent callback
    fn1.mockClear();
    const s2 = createDispose();
    const unsub2 = s2.onDispose(fn1);
    unsub2();
    s2.dispose();
    expect(fn1).toBeCalledTimes(0);
  });

  it("merged should combine properties from multiple objects", () => {
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };
    const obj3 = {
      get c() {
        return 3;
      },
    };

    const merged = mergedFn(obj1, obj2, obj3);
    expect(merged.a).toBe(1);
    expect(merged.b).toBe(2);
    expect(merged.c).toBe(3);

    // property descriptors should be preserved
    const desc = Object.getOwnPropertyDescriptor(merged, "c");
    expect(typeof desc?.get).toBe("function");
  });

  it("createAPI should with a preset context", () => {
    const ctx = createAPI((ctx) => ctx);
    const fn1 = mock(() => void 0);

    // basic behavior check
    ctx.onDispose(fn1);
    ctx.dispose();
    expect(fn1).toBeCalledTimes(1);
  });
});

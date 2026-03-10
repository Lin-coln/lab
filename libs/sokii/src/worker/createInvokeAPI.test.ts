import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { createInvokeAPI } from "./createInvokeAPI.ts";
import { isMainThread } from "bun";

type TestAPI = {
  plus(a: number, b: number): number;
  minus(a: number, b: number): number;
  reflect(type: "minus", a: number, b: number): void;
};

if (isMainThread) {
  describe("createInvokeAPI", () => {
    let worker: Worker;
    let create: ReturnType<typeof createInvokeAPI<TestAPI>>;

    beforeEach(async () => {
      worker = await new Promise((resolve) => {
        const worker = new Worker(import.meta.filename); // create from self
        worker.addEventListener("open", () => resolve(worker), { once: true });
      });
      create = createInvokeAPI<TestAPI>(worker);
    });

    afterEach(() => {
      worker.terminate();
    });

    it("should invoke plus", async () => {
      const api = create((ctx) => ctx);
      const plus = (a: number, b: number) => api.invoke("plus", a, b);
      const result = await plus(3, 4);
      expect(result).toBe(7);
      expect(plus(10, 0)).rejects.toThrow("plus 0");
    });

    it("should handle minus", async () => {
      const api = create((ctx) => ctx);
      const fn1 = mock((a, b) => {
        if (b === 0) throw new Error("minus 0");
        return a - b;
      });
      api.handle("minus", fn1);
      const minus = (a: number, b: number) => api.invoke("reflect", "minus", a, b);
      await minus(10, 6);
      expect(fn1).toBeCalledWith(10, 6);
      expect(minus(10, 0)).rejects.toThrow("minus 0");
    });

    it("should throw when handler not found", async () => {
      const api = create((ctx) => ctx);
      expect(api.invoke("minus", 1, 2)).rejects.toThrow("handler not found - minus");
    });

    it("should throw on duplicate handler registration", () => {
      const api = create((ctx) => ctx);
      const registry = () => api.handle("plus", (a, b) => a + b);
      registry();
      expect(registry).toThrow("Handler has already been registered - plus");
    });

    it("should off handler", async () => {
      const api = create((ctx) => ctx);
      const fn1 = mock((a, b) => a - b);
      const off = api.handle("minus", fn1);

      await api.invoke("reflect", "minus", 10, 6);
      expect(fn1).toBeCalledWith(10, 6);

      off();
      expect(api.invoke("reflect", "minus", 10, 6)).rejects.toThrow("handler not found - minus");
    });

    it("should dispose", async () => {
      const api = create((ctx) => ctx);
      const fn1 = mock((a, b) => a - b);
      const reflect = () => api.invoke("reflect", "minus", 10, 6);
      const handle = () => api.handle("minus", fn1);

      handle();
      await reflect();
      expect(fn1).toBeCalledWith(10, 6);

      api.dispose();
      expect(reflect).toThrow("InvokeAPI is disposed");
      expect(handle).toThrow("InvokeAPI is disposed");
    });
  });
} else {
  // Worker block
  const api = createInvokeAPI<TestAPI>(self as any)((ctx) => ctx);
  api.handle("plus", (a, b) => {
    if (b === 0) throw new Error("plus 0");
    return a + b;
  });
  api.handle("reflect", async (...args) => {
    const [type] = args;
    if (type === "minus") {
      const [_, a, b] = args;
      await api.invoke("minus", a, b);
    }
  });
}

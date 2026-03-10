import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { createMessageAPI } from "./createMessageAPI.ts";
import { isMainThread } from "bun";

type TestAPI = {
  ping(val: "ping" | "pong"): void;
};

if (isMainThread) {
  /**
   * test block
   */
  describe("createMessageAPI", () => {
    let worker: Worker;
    let create: ReturnType<typeof createMessageAPI<TestAPI>>;

    beforeEach(async () => {
      worker = await new Promise((resolve) => {
        const worker = new Worker(import.meta.filename); // create from self
        worker.addEventListener("open", () => resolve(worker), { once: true });
      });
      create = createMessageAPI(worker);
    });

    afterEach(() => {
      worker.terminate();
    });

    it("should post message to worker and receive response", async () => {
      const api = create((ctx) => ({
        ping() {
          return new Promise((resolve) => {
            ctx.onReceiveMessage((msg) => resolve(msg));
            ctx.postMessage("ping");
          });
        },
      }));

      const pong = await api.ping();
      expect(pong).toBe("pong");
    });

    it("should clear listeners on dispose", () => {
      const api = create((ctx) => ctx);
      const fn1 = mock();

      const post = () => worker.dispatchEvent(new MessageEvent("message", { data: ["pong"] }));

      const off = api.onReceiveMessage(fn1);
      post();
      expect(fn1).toBeCalledTimes(1);

      fn1.mockClear();
      off();
      post();
      expect(fn1).not.toHaveBeenCalled();

      fn1.mockClear();
      api.onReceiveMessage(fn1);
      api.dispose();
      post();
      expect(fn1).not.toHaveBeenCalled();
    });
  });
} else {
  /**
   * worker block
   */
  const api = createMessageAPI<TestAPI>(self as any)((ctx) => ctx);
  api.onReceiveMessage((msg) => {
    if (msg === "ping") {
      api.postMessage("pong");
    }
  });
}

import { type InvokeAPI, type ProxyAPI, type ProxyFns, type PresetContext } from "..";
import { createInvokeAPI } from "./createInvokeAPI.ts";
import { createProxy } from "../shared/proxy.ts";

type Extra<Invokes extends ProxyFns = ProxyFns, Handles extends ProxyFns = Invokes> = Pick<
  PresetContext & InvokeAPI<Invokes, Handles>,
  "handle" | "dispose"
> & {
  worker: Worker;
};

export function createProxyAPI<Invokes extends ProxyFns = ProxyFns, Handles extends ProxyFns = Invokes>(
  url: string | URL,
  workerOpts?: WorkerOptions,
): Promise<ProxyAPI<Extra<Invokes, Handles>, Invokes>>;
export function createProxyAPI<Invokes extends ProxyFns = ProxyFns, Handles extends ProxyFns = Invokes>(
  worker: Worker,
): ProxyAPI<Extra<Invokes, Handles>, Invokes>;
export function createProxyAPI<Invokes extends ProxyFns = ProxyFns, Handles extends ProxyFns = Invokes>(
  urlOrWorker: string | URL | Worker,
  workerOpts?: WorkerOptions,
): Promise<ProxyAPI<Extra<Invokes, Handles>, Invokes>> | ProxyAPI<Extra<Invokes, Handles>, Invokes> {
  if (typeof urlOrWorker === "string" || urlOrWorker instanceof URL) {
    const url = urlOrWorker;
    const workerPromise = new Promise<Worker>((resolve, reject) => {
      const worker = new Worker(url, workerOpts);
      worker.addEventListener("open", () => resolve(worker), { once: true });
      worker.addEventListener("error", (event) => reject(event.error), { once: true });
    });
    return workerPromise.then((worker) => {
      process.on("SIGINT", () => worker.terminate());
      process.on("SIGTERM", () => worker.terminate());
      return createProxyAPI<Invokes, Handles>(worker);
    });
  }

  const worker = urlOrWorker;
  return (
    createInvokeAPI<Invokes, Handles>(worker)
      // create
      .create((ctx) =>
        createProxy<Extra<Invokes, Handles>, Invokes>(ctx, {
          handle: ctx.handle,
          dispose: ctx.dispose,
          worker,
        }),
      )
  );
}

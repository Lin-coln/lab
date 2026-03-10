import { createAPI, type PresetContext, type MessageAPI, type AnyFns } from "..";

export function createMessageAPI<API extends AnyFns = AnyFns>(worker: Worker) {
  return createAPI.pipe((ctx: PresetContext) => ctx.merged(ctx, create$message(ctx, worker) as MessageAPI<API>));
}

function create$message(ctx: PresetContext, worker: Worker) {
  const listeners: Set<(...args: any[]) => void> = new Set();
  worker.addEventListener("message", handleReceive);

  ctx.onDispose(() => {
    listeners.clear();
    worker.removeEventListener("message", handleReceive);
  });

  return {
    postMessage,
    onReceiveMessage,
  };

  function handleReceive(evt: MessageEvent) {
    const args = evt.data as any[];
    listeners.forEach((listener) => listener(...args));
  }

  function postMessage(...args: any[]) {
    worker.postMessage(args);
  }

  function onReceiveMessage(listener: (...args: any[]) => void): () => void {
    listeners.add(listener);
    return (): void => void listeners.delete(listener);
  }
}

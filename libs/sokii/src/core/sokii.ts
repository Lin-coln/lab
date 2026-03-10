import { type CreateAPI, Factory } from "./factory.ts";
import { merged } from "./merge.ts";

export interface PresetContext {
  merged: typeof merged;
  dispose: ReturnType<typeof createDispose>["dispose"];
  onDispose: ReturnType<typeof createDispose>["onDispose"];
}

export const createAPI = Factory.create([] as const)
  // merged
  .pipe(() => ({ merged }))
  // dispose
  .pipe((ctx) => ctx.merged(ctx, createDispose()) as PresetContext);

export function createDispose() {
  const disposes: Set<() => void> = new Set();
  return {
    dispose,
    onDispose,
  };
  function onDispose(callback: () => void): () => void {
    disposes.add(callback);
    return (): void => void disposes.delete(callback);
  }

  function dispose(): void {
    const callbacks = Array.from(disposes);
    disposes.clear();
    callbacks.forEach((cb) => cb());
  }
}

import { describe, it, expect } from "bun:test";
import { resolvePipesOutput, type Pipe } from "./pipe";

describe("Pipe system", () => {
  it("process single pipe", () => {
    const p1: Pipe<{}, { foo: number }> = () => ({ foo: 42 });
    const result = resolvePipesOutput([p1] as const);
    expect(result).toEqual({ foo: 42 });
  });

  it("process multiple pipes sequentially", () => {
    const p1: Pipe<{}, { a: number }> = () => ({ a: 1 });
    const p2: Pipe<{ a: number }, { b: number }> = (ctx) => ({ b: ctx.a + 1 });
    const p3: Pipe<{ b: number }, { c: number }> = (ctx) => ({ c: ctx.b + 1 });

    const result = resolvePipesOutput([p1, p2, p3] as const);
    expect(result).toEqual({ c: 3 });
  });

  it("process with no pipes returns empty object", () => {
    const result = resolvePipesOutput([]);
    expect(result).toEqual({});
  });

  it("pipes with string values", () => {
    const p1: Pipe<{}, { msg: string }> = () => ({ msg: "hello" });
    const p2: Pipe<{ msg: string }, { upper: string }> = (ctx) => ({ upper: ctx.msg.toUpperCase() });

    const result = resolvePipesOutput([p1, p2] as const);
    expect(result).toEqual({ upper: "HELLO" });
  });
});

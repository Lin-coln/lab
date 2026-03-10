import { describe, it, expect } from "bun:test";
import { Factory, type CreateAPI } from "./factory.ts";
import type { Pipe } from "./pipe.ts";

describe("Factory", () => {
  it("create() should build context", () => {
    const api = makeAPI(() => ({ foo: 42 }));
    const result = api.create((ctx) => ({ bar: ctx.foo + 1 }));

    expect(result.bar).toBe(43);
  });

  it("pipe() should extend context", () => {
    const api = makeAPI()
      .pipe(() => ({ foo: 1 }))
      .pipe((ctx) => ({ ...ctx, bar: 2 }));

    const result = api.create((ctx) => ({ sum: ctx.foo + ctx.bar }));
    expect(result.sum).toBe(3);
  });

  it("clone() should not share pipelines", () => {
    const api1 = makeAPI(() => ({ x: 10 })).pipe((ctx) => ({
      ...ctx,
      y: 20,
    }));
    const api2 = api1.clone();

    const r1 = api1.create((ctx) => ({ sum: ctx.x + ctx.y }));
    expect(r1.sum).toBe(30);

    const r2 = api2.create((ctx) => ({ onlyX: ctx.x }));
    expect(r2.onlyX).toBe(10);
    expect((r2 as any).y).toBeUndefined();
  });

  it("API itself should be callable", () => {
    const api = makeAPI(() => ({ a: "hello" }));
    const result = api((ctx) => ({ msg: ctx.a + " world" }));

    expect(result.msg).toBe("hello world");
  });
});

function makeAPI<P extends Pipe<any, any>>(pipe?: P): CreateAPI<P extends Pipe<any, any> ? [P] : []> {
  if (pipe) {
    return Factory.create([pipe] as const) as any;
  }
  const emptyPipe: Pipe<{}, {}> = (ctx) => ctx;
  return Factory.create([emptyPipe] as const) as any;
}

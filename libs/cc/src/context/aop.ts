export namespace AOP {
  export interface MW<Args extends any[], R extends Awaited<any>> {
    (next: (...args: Args) => R | Promise<R>, ...args: Args): R | Promise<R>;
  }

  export interface Ctx<Args extends any[], R extends Awaited<any>> {
    wrap(fn: (...args: Args) => R | Promise<R>): (...args: Args) => Promise<R>;

    use: <This>(this: This, mw?: AOP.MW<Args, R>) => This;
    before: <This>(this: This, fn?: (...args: Args) => unknown) => This;
    after: <This>(this: This, fn?: (...args: Args) => unknown) => This;
    catch: <This>(this: This, fn?: (err: unknown) => R | Promise<R>) => This;
  }

  export type Bounded<This, Args extends any[], R extends Awaited<any>> = {
    [K in keyof Ctx<Args, R>]: Ctx<Args, R>[K] extends (this: any, ...args: infer A) => any
      ? (this: This, ...args: A) => This
      : never;
  };

  export interface Fn<Args extends any[], R extends Awaited<any>> extends Pick<
    AOP.Bounded<Fn<Args, R>, Args, R>,
    "use" | "before" | "after" | "catch"
  > {
    (...args: Args): Promise<R>;
  }
}

export function createAOP<T, Args extends any[], R>(create: (ctx: AOP.Ctx<Args, R>) => T): T {
  const items: AOP.MW<Args, R>[] = [];

  return create({
    wrap,
    use,
    before,
    after,
    catch: catch0,
  });

  function wrap(fn: (...args: Args) => R | Promise<R>): (...args: Args) => Promise<R> {
    return items.reduce(
      (acc, mw) =>
        (...args: Args) =>
          mw(acc, ...args),
      fn,
    ) as any;
  }

  function use<This>(this: This, mw?: AOP.MW<Args, R>) {
    if (mw) items.push(mw);
    return this;
  }

  function before<This>(this: This, fn?: (...args: Args) => unknown): This {
    if (!fn) return this;
    return use.call(this, async (next, ...args) => {
      await fn(...args);
      return next(...args);
    }) as This;
  }

  function after<This>(this: This, fn?: (...args: Args) => unknown): This {
    if (!fn) return this;
    return use.call(this, async (next, ...args) => {
      const res = await next(...args);
      await fn(...args);
      return res;
    }) as This;
  }

  function catch0<This>(this: This, fn?: (err: unknown) => R | Promise<R>): This {
    if (!fn) return this;
    return use.call(this, async (next, ...args) => {
      try {
        return await next(...args);
      } catch (e) {
        return await fn(e);
      }
    }) as This;
  }
}

export function createFunction<Args extends any[], R extends Awaited<any>>(fn: (...args: Args) => R | Promise<R>) {
  return createAOP<AOP.Fn<Args, R>, Args, R>((ctx) => {
    return Object.assign((...args: Args) => ctx.wrap(fn)(...args), {
      use: ctx.use,
      before: ctx.before,
      after: ctx.after,
      catch: ctx.catch,
    });
  });
}

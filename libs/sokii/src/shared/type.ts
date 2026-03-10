export type AnyFn = (...args: any[]) => any;

export type AnyFns = Record<string, AnyFn>;

export type InvokeOf<Fn extends AnyFn> = (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>;

export type HandlerOf<Fn extends AnyFn> = (
  ...args: Parameters<Fn>
) => Promise<Awaited<ReturnType<Fn>>> | Awaited<ReturnType<Fn>>;

/// message types
export type MessageAPI<API extends AnyFns = AnyFns> = {
  readonly postMessage: <T extends keyof API>(...args: Parameters<API[T]>) => void;
  readonly onReceiveMessage: <T extends keyof API>(listener: (...args: Parameters<API[T]>) => void) => () => void;
};

// invoke types
export type HandlersMap<Handles extends AnyFns> = { [T in keyof Handles]: HandlerOf<Handles[T]> };
export type InvokeAPI<Invokes extends AnyFns = AnyFns, Handles extends AnyFns = Invokes> = {
  readonly invoke: <T extends keyof Invokes>(
    name: T,
    ...args: Parameters<Invokes[T]>
  ) => Promise<Awaited<ReturnType<Invokes[T]>>>;
  // readonly handle: <T extends keyof Handles>(name: T, handler: HandlerOf<Handles[T]>) => () => void;
  readonly handle: {
    <T extends keyof Handles>(name: T, handler: HandlerOf<Handles[T]>): () => void;
    <Map extends Partial<HandlersMap<Handles>>>(handlers: Map): () => void;
  };
};

// proxy types
export type ProxyFns<Extra extends Record<string, any> = {}> = Exclude<AnyFns, keyof Extra>;
export type ProxyAPI<
  Extra extends Record<string, any> = {},
  Invokes extends ProxyFns<Extra> = ProxyFns<Extra>,
> = Extra & Readonly<{ [T in keyof Invokes]: InvokeOf<Invokes[T]> }>;

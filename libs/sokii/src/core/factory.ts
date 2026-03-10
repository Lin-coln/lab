import { type Pipe, type Output, resolvePipesOutput } from "./pipe.ts";

export type CreateAPI<Pipes extends readonly Pipe<any, any>[]> = CreateProps<Pipes>["create"] & CreateProps<Pipes>;
export interface CreateProps<Pipes extends readonly Pipe<any, any>[]> {
  create<T extends Record<string, any>>(create: (ctx: Output<Pipes>) => T): T;
  clone(): CreateAPI<Pipes>;
  pipe<P extends Pipe<Output<Pipes>, any>>(pipe: P): CreateAPI<readonly [...Pipes, P]>;
}

export class Factory<Pipes extends readonly Pipe<any, any>[]> implements CreateProps<Pipes> {
  static create<Pipes extends readonly Pipe<any, any>[]>(pipelines: Pipes): CreateAPI<Pipes> {
    return new Factory(pipelines, true).#createAPI;
  }

  readonly #pipelines: Pipes;
  readonly #createAPI: CreateAPI<Pipes>;
  private constructor(pipelines: Pipes, isRoot: boolean) {
    this.#pipelines = pipelines;

    const createAPI: CreateProps<Pipes>["create"] = <T extends Record<string, any>>(
      create: (ctx: Output<Pipes>) => T,
    ): T => this.create(create);
    const createProps: CreateProps<Pipes> = {
      create: this.create.bind(this),
      clone: this.clone.bind(this),
      pipe: isRoot ? <P extends Pipe<Output<Pipes>, any>>(pipe: P) => this.clone().pipe(pipe) : this.pipe.bind(this),
    };
    this.#createAPI = Object.assign(createAPI, createProps);
  }

  create<T extends Record<string, any>>(create: (ctx: Output<Pipes>) => T): T {
    const ctx = resolvePipesOutput(this.#pipelines);
    return create(ctx);
  }

  clone(): CreateAPI<Pipes> {
    return new Factory<Pipes>([...this.#pipelines] as any, false).#createAPI;
  }

  pipe<P extends Pipe<Output<Pipes>, any>>(pipe: P): CreateAPI<[...Pipes, P]> {
    (this.#pipelines as any).push(pipe);
    return this.#createAPI as any;
  }
}

export type Pipe<I extends object, O extends object> = (input: I) => O;

type PipesOut<Pipes extends readonly Pipe<any, any>[], Ctx extends object = {}> = Pipes extends readonly [
  Pipe<infer I, infer O>,
  ...infer Rest extends readonly Pipe<any, any>[],
]
  ? Ctx extends I
    ? PipesOut<Rest, O>
    : never
  : Ctx;

export type Output<P extends Pipe<any, any> | readonly Pipe<any, any>[]> = P extends readonly Pipe<any, any>[]
  ? PipesOut<P>
  : P extends Pipe<any, any>
    ? PipesOut<readonly [P]>
    : never;

export function resolvePipesOutput<Pipes extends readonly Pipe<any, any>[]>(pipes: Pipes): Output<Pipes> {
  let output: any = {};
  for (const pipe of pipes) {
    output = pipe(output);
  }
  return output;
}

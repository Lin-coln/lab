type Overwrite<O1, O2> = Omit<O1, keyof O2> & O2;
type MergedTwo<O1, O2> = [keyof O1 & keyof O2] extends [never] ? O1 & O2 : Overwrite<O1, O2>;

export type Merged<T extends Record<any, any>[]> = T extends [
  infer T extends Record<any, any>,
  ...infer Rest extends Record<any, any>[],
]
  ? MergedTwo<T, Merged<Rest>>
  : {};

export function merged<Items extends readonly Record<string, any>[]>(...items: Items): Merged<[...Items]> {
  const next = {};

  Object.defineProperties(
    next,
    items.reduce(
      (acc, cur) =>
        Object.assign(acc, {
          ...Object.getOwnPropertyDescriptors(cur),
        }),
      {},
    ),
  );

  return next as any;
}

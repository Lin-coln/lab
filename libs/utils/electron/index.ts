export * from "./build.ts";

export function resolveArgs<T extends Record<string, string | number | boolean>>(args: string[]) {
  return Object.fromEntries(
    args
      .filter((x) => x.startsWith("--"))
      .map((x) => {
        let [k, v] = x.split("=");
        v ??= "true";
        try {
          v = JSON.parse(v);
        } catch {}
        return [k!.slice(2), v as any];
      }),
  ) as T;
}

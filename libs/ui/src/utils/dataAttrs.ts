export function toDataAttrs(attrs: Record<string, void | boolean | string | number>) {
  const entries = Object.entries(attrs).map(([k, v]) => {
    return [
      `data-${k}`,
      typeof v === "boolean" ? (v ? "" : void 0) : typeof v === "string" ? v : typeof v === "number" ? v : void 0,
    ] as [string, void | "" | string | number];
  });

  return Object.fromEntries(entries);
}

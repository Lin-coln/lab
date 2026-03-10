export function uuid(): string {
  const random = () => Math.floor(Math.random() * 256);
  const arr = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    arr[i] = random();
  }
  arr[6] = (arr[6]! & 0x0f) | 0x40; // version 4
  arr[8] = (arr[8]! & 0x3f) | 0x80; // variant 10
  return [...arr]
    .map((b, i) => {
      const s = b.toString(16).padStart(2, "0");
      return [4, 6, 8, 10].includes(i) ? "-" + s : s;
    })
    .join("");
}

export async function generateResponse(execute: () => any): Promise<{ data: any; error: any }> {
  try {
    const data = await execute();
    return { data, error: void 0 };
  } catch (err: any) {
    const error: string = typeof err === "string" ? err : err instanceof Error ? err.message : err.toString();
    return { data: void 0, error };
  }
}

// internal
export type InvokeRendererChannels = {
  "@invoke-renderer/request": (req: { id: string; channel: string; args: any[] }) => void;
  "@invoke-renderer/response": (resp: { id: string; result: any; error: any }) => void;
};

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

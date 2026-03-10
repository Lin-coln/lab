import type { BunRequest } from "bun";

export const NAME = "/video";

export async function GET(req: BunRequest) {
  const isAborted = () => req.signal.aborted;
  if (isAborted()) return new Response(null);

  await Bun.sleep(100);
  if (isAborted()) return new Response(null);

  const basename = "bunny.mp4";
  // const basename = "陈奕迅：Fear and Dreams世界巡回演唱会 (2025) - 1080p.WEB-DL.AAC.H.264-HiveWeb 无水印.mp4";
  const filename1 = `/Users/linken/Desktop/${basename}`;
  const filename2 = `C:\\Users\\LinColn\\Downloads\\${basename}`;
  const file = Bun.file(process.platform === "win32" ? filename2 : filename1);

  const size = file.size;
  const [start = 0, end = size - 1] = (req.headers.get("Range")?.split("=")?.at(-1) ?? "0-")
    .split("-")
    .map((x) => (x ? Number(x) : void 0));
  if (start === 0 && end === size - 1) {
    return new Response(file);
  } else {
    return new Response(file.slice(start, end), {
      status: 206,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }
}

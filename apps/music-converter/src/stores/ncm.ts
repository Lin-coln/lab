import { ebc, rc4 } from "./crypto";

namespace NCM {
  export type Meta = {
    album: string;
    albumId: number;
    albumPic: string;
    albumPicDocId: string;
    alias: unknown[];
    artist: [string, number][];
    bitrate: number;
    duration: number;
    format: "mp3" | string;
    mp3DocId: string;
    musicId: number;
    musicName: string;
    mvId: number;
    transNames: unknown[];
  };
}

export function parseMusicFileNCM(buf: ArrayBuffer) {
  const { meta, coverData, audioData } = parse(buf);
  return {
    name: meta.musicName,
    artists: (meta.artist ?? []).map((x) => x[0]),
    album: {
      name: meta.album,
      image: meta.albumPic,
    },
    data: audioData,
  };
}

function parse(buf: ArrayBuffer) {
  const core = createCore(buf);

  validateHead(core.read(8));
  core.seek(2);

  const keyLen = getLength(core.read(4));
  const key = parseKey(core.read(keyLen));
  // todo: skip if not metaLen
  const metaLen = getLength(core.read(4));
  const meta: NCM.Meta = parseMeta(core.read(metaLen));
  core.seek(5);

  // todo: skip if not coverLen
  const coverCRC = getLength(core.read(4));
  const coverLen = getLength(core.read(4));
  const coverData = core.read(coverLen);
  core.seek(coverCRC - coverLen);

  const audioData: Uint8Array<ArrayBuffer> = parseAudio(core.read()) as any;

  return {
    key,
    meta,
    coverData,
    audioData,
  };

  function validateHead(u8: Uint8Array) {
    const head = Array.prototype.map.call(u8, (x) => `00${x.toString(16)}`.slice(-2)).join("");
    if (head === "4354454e4644414d") return;
    console.error(`file head: ${head}`);
    throw new Error(`Invalid ncm file head`);
  }

  function getLength(u8: Uint8Array) {
    // reverse: for little endian
    const hex = Array.from(u8)
      .reverse()
      .map((x) => `00${x.toString(16)}`.slice(-2))
      .join("");
    return parseInt(hex, 16);
  }

  function parseKey(u8: Uint8Array) {
    const raw = u8.map((x) => x ^ 0x64);
    const key = hexToU8Arr("687A4852416D736F356B496E62617857");
    const content = new TextDecoder().decode(ebc(key).decrypt(raw));
    if (!content.startsWith("neteasecloudmusic")) {
      console.error(`key content: ${content}`);
      throw new Error(`Invalid ncm file key`);
    }
    return content.slice(17);
  }

  function parseMeta(u8: Uint8Array) {
    const raw = u8.map((x) => x ^ 0x63);

    const str = String.fromCharCode(...raw);
    if (!str.startsWith("163 key(Don't modify):")) {
      console.error(`meta str: ${str}`);
      throw new Error(`Invalid ncm file meta`);
    }

    const key = hexToU8Arr("2331346C6A6B5F215C5D2630553C2728");
    const sliced = b64ToU8Arr(str.slice(22));
    const content = new TextDecoder().decode(ebc(key).decrypt(sliced));
    if (!content.startsWith("music:")) {
      console.error(`meta content: ${content}`);
      throw new Error(`Invalid ncm file meta`);
    }

    try {
      return JSON.parse(content.slice(6));
    } catch {
      console.error(`meta content: ${content}`);
      throw new Error(`Failed to parse meta content`);
    }
  }

  function parseAudio(u8: Uint8Array) {
    return rc4(u8, new TextEncoder().encode(key));
  }
}

function createCore(buf: ArrayBuffer) {
  let cur: number = 0;

  return {
    seek,
    read,
  };

  function seek(ofs: number) {
    cur += ofs;
  }

  function read(len?: number) {
    if (!len) {
      return new Uint8Array(buf, cur);
    }

    const res = new Uint8Array(buf, cur, len);
    seek(len);
    return res;
  }
}

function parseFormat(u8: Uint8Array) {
  const formatCode = Array.prototype.map
    .call(u8.slice(0, 4), (x: number) => x.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const signatures: Record<string, string> = {
    "89504E47": "png",
    FFD8FFE0: "jpg",
    FFD8FFE1: "jpg",
    FFD8FFDB: "jpg",
    "47494638": "gif",
    "52494646": "webp",
  };
  const format = signatures[formatCode];
  if (!format) {
    throw new Error(`Invalid ncm cover format: ${formatCode}`);
  }

  return format;
}

function hexToU8Arr(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }

  const len = hex.length / 2;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    const byte = hex.slice(i * 2, i * 2 + 2);
    bytes[i] = parseInt(byte, 16);
  }

  return bytes;
}

function b64ToU8Arr(base64: string): Uint8Array {
  if (base64.startsWith("data:")) {
    base64 = base64.slice(base64.indexOf(",") + 1);
  }

  if (typeof atob === "function") {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  return Uint8Array.from(Buffer.from(base64, "base64"));
}

import CryptoJS from "crypto-js";

type MetaData = {
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

class MusicFileReader {
  cur: number;
  arrayBuffer: ArrayBuffer;
  constructor(arrayBuffer: ArrayBuffer) {
    this.cur = 0;
    this.arrayBuffer = arrayBuffer;
  }

  seek(ofs: number) {
    this.cur += ofs;
  }

  read(len?: number) {
    if (!len) {
      return new Uint8Array(this.arrayBuffer, this.cur);
    } else {
      const res = new Uint8Array(this.arrayBuffer, this.cur, len);
      this.cur += len;
      return res;
    }
  }

  decode(uint8arr, arg) {
    return uint8arr.map((x) => x ^ arg);
  }

  static getLength(unit8arr: Uint8Array<ArrayBuffer>) {
    // reverse: for little endian
    const hex = Array.from(unit8arr)
      .reverse()
      .map((x) => `00${x.toString(16)}`.slice(-2))
      .join("");
    return parseInt(hex, 16);
  }

  static decryptAES(data, key: string) {
    let input;
    if (typeof data === "string") {
      input = data;
    } else if (Object.prototype.toString.call(data) === "[object Uint8Array]") {
      input = CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(data.buffer));
    }
    const decrypted = CryptoJS.AES.decrypt(input, CryptoJS.enc.Hex.parse(key), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  static decryptRC4(uint8arr: Uint8Array<ArrayBuffer>, key: string) {
    const len_k = key.length;
    const len = uint8arr.byteLength;
    const keyBuf = str2buf(key);
    const S = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;
    let tmp;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i]! + keyBuf[i % len_k]!) & 0xff;
      tmp = S[i];
      S[i] = S[j]!;
      S[j] = tmp;
    }
    let stream = Array.from(S, (_, i) => {
      return S[(S[i]! + S[(i + S[i]!) & 0xff]!) & 0xff];
    });
    stream = Array.from({ length: Math.ceil(len / 256) })
      .map(() => stream)
      .flat()
      .slice(1, 1 + len);
    const arr: number[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(uint8arr[i]! ^ stream[i]!);
    }
    return new Uint8Array(arr);

    function str2buf(str) {
      const arr: number[] = [];
      for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i));
      }
      return new Uint8Array(arr);
    }
  }
}

class MusicFileReader_NCM extends MusicFileReader {
  constructor(arrayBuffer: ArrayBuffer) {
    super(arrayBuffer);
  }

  validateHead() {
    const head_raw = this.read(8);
    const head = Array.prototype.map.call(head_raw, (x) => `00${x.toString(16)}`.slice(-2)).join("");
    if (head !== "4354454e4644414d") {
      console.warn(`invalid ncm file head: ${head}`);
      return false;
    }
    return true;
  }

  parseKey() {
    const keyLen = MusicFileReader.getLength(this.read(4));
    const keyData_raw = this.read(keyLen);
    const keyData_decrypted = MusicFileReader.decryptAES(
      this.decode(keyData_raw, 0x64),
      `687A4852416D736F356B496E62617857`,
    );
    if (!keyData_decrypted.startsWith("neteasecloudmusic")) {
      console.warn(`invalid ncm file key: ${keyData_decrypted}`);
      return null;
    }
    return keyData_decrypted.slice(17);
  }

  parseMeta() {
    const metaLen = MusicFileReader.getLength(this.read(4));
    // todo: skip if not metaLen
    let metaData_raw: Uint8Array<ArrayBuffer> | string = this.read(metaLen);
    metaData_raw = String.fromCharCode(...this.decode(metaData_raw, 0x63));
    if (!metaData_raw.startsWith("163 key(Don't modify):")) {
      console.warn(`invalid ncm file meta_raw: ${metaData_raw}`);
      return null;
    }
    metaData_raw = metaData_raw.slice(22);

    const metaData_decrypted = MusicFileReader.decryptAES(metaData_raw, "2331346C6A6B5F215C5D2630553C2728");
    if (!metaData_decrypted.startsWith("music:")) {
      console.warn(`invalid ncm file metaData: ${metaData_decrypted}`);
    }
    const metaData = metaData_decrypted.slice(6);

    try {
      const data = JSON.parse(metaData);
      console.log(`metaData was parsed:`, data);
      return data as MetaData;
    } catch (e) {
      console.warn(`failed to parse metaData to json: `, metaData);
      return null;
    }
  }

  parseCover() {
    const coverCRC = MusicFileReader.getLength(this.read(4));
    const coverLen = MusicFileReader.getLength(this.read(4));
    // todo: skip if not coverLen
    const coverData = this.read(coverLen);
    console.log(`coverData was parsed:`, {
      coverCRC,
      coverLen,
      coverDataLen: coverData.length,
    });
    this.seek(coverCRC - coverLen);
    return coverData;
  }

  startup() {
    this.cur = 0;
    const isNCM = this.validateHead();
    if (!isNCM) {
      throw new Error("ncm head not found.");
    }
    this.seek(2);
    const keyData = this.parseKey();
    if (!keyData) {
      throw new Error("ncm key not found.");
    }
    const metaData = this.parseMeta();
    this.seek(5);
    const coverData = this.parseCover();

    const remains = this.read();
    const musicData = MusicFileReader.decryptRC4(remains, keyData);

    return {
      metaData,
      coverData,
      musicData,
    };
  }
}

export function parseMusicFileNCM(arrBuffer: ArrayBuffer) {
  const { metaData, coverData, musicData } = new MusicFileReader_NCM(arrBuffer).startup();
  const formatCode = Array.prototype.map.call(coverData.slice(0, 4), (x) => `00${x.toString(16)}`.slice(-2)).join("");
  const coverFormat = { "89504E47": "png" }[formatCode] ?? "jpg";

  if (!metaData) throw new Error("ncm missing meta data");

  return {
    name: metaData.musicName as string,
    artists: (metaData.artist ?? []).map((x) => x[0]) as string[],
    album: {
      name: metaData.album as string,
      image: metaData.albumPic as string,
    },
    // coverFormat: coverFormat,
    // coverData: coverData,
    data: musicData,
  };
}

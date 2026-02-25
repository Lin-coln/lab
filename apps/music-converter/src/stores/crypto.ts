class AES {
  gf: ReturnType<typeof createGF>;
  sbox: ReturnType<typeof createSBOX>;
  keys: Uint32Array[];

  constructor(key: Uint8Array) {
    this.gf = createGF();
    this.sbox = createSBOX(this.gf);
    this.keys = keyExpansion({ key, sbox: this.sbox });
  }

  encrypt(data: Uint8Array): Uint8Array {
    const u32 = this.#toU32(data);
    const keys = this.keys;
    for (let r = 0; r < keys.length; r++) {
      const key = keys[r]!;
      if (r) {
        for (let i = 0; i < 4; i++) u32[i] = this.#subBytes(u32[i]!);
        this.#shiftRows(u32);
        if (r !== keys.length - 1) {
          for (let i = 0; i < 4; i++) u32[i] = this.#mixColumns(u32[i]!);
        }
      }
      for (let i = 0; i < 4; i++) u32[i]! ^= key[i]!;
    }
    return this.#toU8(u32);
  }
  decrypt(data: Uint8Array): Uint8Array {
    const u32 = this.#toU32(data);
    const keys = this.keys;
    for (let r = keys.length - 1; r >= 0; r--) {
      const key = keys[r]!;
      // add key
      for (let i = 0; i < 4; i++) u32[i]! ^= key[i]!;
      if (r) {
        if (r !== keys.length - 1) {
          for (let i = 0; i < 4; i++) u32[i] = this.#invMixColumns(u32[i]!);
        }
        this.#invShiftRows(u32);
        for (let i = 0; i < 4; i++) u32[i] = this.#invSubBytes(u32[i]!);
      }
    }
    return this.#toU8(u32);
  }

  #toU32(u8: Uint8Array): Uint32Array {
    if (u8.length % 4 !== 0) throw new Error("Data length must be multiple of 4");
    const u32 = new Uint32Array(u8.length / 4);
    for (let i = 0; i < u32.length; i++) {
      u32[i] = (u8[i * 4 + 0]! << 24) | (u8[i * 4 + 1]! << 16) | (u8[i * 4 + 2]! << 8) | (u8[i * 4 + 3]! << 0);
    }
    return u32;
  }
  #toU8(u32: Uint32Array): Uint8Array {
    const u8 = new Uint8Array(u32.length * 4);
    for (let i = 0; i < u32.length; i++) {
      u8[i * 4 + 0] = (u32[i]! >>> 24) & 0xff;
      u8[i * 4 + 1] = (u32[i]! >>> 16) & 0xff;
      u8[i * 4 + 2] = (u32[i]! >>> 8) & 0xff;
      u8[i * 4 + 3] = (u32[i]! >>> 0) & 0xff;
    }
    return u8;
  }

  #subBytes(w: number) {
    const s0 = (w >>> 24) & 0xff;
    const s1 = (w >>> 16) & 0xff;
    const s2 = (w >>> 8) & 0xff;
    const s3 = (w >>> 0) & 0xff;
    return (this.sbox.get(s0) << 24) | (this.sbox.get(s1) << 16) | (this.sbox.get(s2) << 8) | (this.sbox.get(s3) << 0);
  }
  #invSubBytes(w: number) {
    const s0 = (w >>> 24) & 0xff;
    const s1 = (w >>> 16) & 0xff;
    const s2 = (w >>> 8) & 0xff;
    const s3 = (w >>> 0) & 0xff;
    return (this.sbox.inv(s0) << 24) | (this.sbox.inv(s1) << 16) | (this.sbox.inv(s2) << 8) | (this.sbox.inv(s3) << 0);
  }

  #shiftRows(u32: Uint32Array) {
    const b0 = 0xff << 24;
    const b1 = 0xff << 16;
    const b2 = 0xff << 8;
    const b3 = 0xff << 0;
    const arr = Array.from(
      { length: 4 },
      (_, i) =>
        (u32[(i + 0) % 4]! & b0) | (u32[(i + 1) % 4]! & b1) | (u32[(i + 2) % 4]! & b2) | (u32[(i + 3) % 4]! & b3),
    );
    for (let i = 0; i < 4; i++) u32[i] = arr[i]!;
  }
  #invShiftRows(u32: Uint32Array) {
    const b0 = 0xff << 24;
    const b1 = 0xff << 16;
    const b2 = 0xff << 8;
    const b3 = 0xff << 0;
    const arr = Array.from(
      { length: 4 },
      (_, i) =>
        (u32[(i + 0) % 4]! & b0) | (u32[(i + 3) % 4]! & b1) | (u32[(i + 2) % 4]! & b2) | (u32[(i + 1) % 4]! & b3),
    );
    for (let i = 0; i < 4; i++) u32[i] = arr[i]!;
  }

  #mixColumns(w: number) {
    const s0 = (w >>> 24) & 0xff;
    const s1 = (w >>> 16) & 0xff;
    const s2 = (w >>> 8) & 0xff;
    const s3 = (w >>> 0) & 0xff;
    return (
      ((this.gf.mul(s0, 2) ^ this.gf.mul(s1, 3) ^ s2 ^ s3) << 24) |
      ((s0 ^ this.gf.mul(s1, 2) ^ this.gf.mul(s2, 3) ^ s3) << 16) |
      ((s0 ^ s1 ^ this.gf.mul(s2, 2) ^ this.gf.mul(s3, 3)) << 8) |
      (this.gf.mul(s0, 3) ^ s1 ^ s2 ^ this.gf.mul(s3, 2))
    );
  }
  #invMixColumns(w: number) {
    const s0 = (w >>> 24) & 0xff;
    const s1 = (w >>> 16) & 0xff;
    const s2 = (w >>> 8) & 0xff;
    const s3 = (w >>> 0) & 0xff;
    return (
      ((this.gf.mul(s0, 14) ^ this.gf.mul(s1, 11) ^ this.gf.mul(s2, 13) ^ this.gf.mul(s3, 9)) << 24) |
      ((this.gf.mul(s0, 9) ^ this.gf.mul(s1, 14) ^ this.gf.mul(s2, 11) ^ this.gf.mul(s3, 13)) << 16) |
      ((this.gf.mul(s0, 13) ^ this.gf.mul(s1, 9) ^ this.gf.mul(s2, 14) ^ this.gf.mul(s3, 11)) << 8) |
      (this.gf.mul(s0, 11) ^ this.gf.mul(s1, 13) ^ this.gf.mul(s2, 9) ^ this.gf.mul(s3, 14))
    );
  }
}

export function ebc(key: Uint8Array) {
  const aes = new AES(key);
  const blockSize = 16;
  return {
    encrypt(data: Uint8Array): Uint8Array {
      const pad = pkcs7().encode(data);
      const out = new Uint8Array(pad.length);
      for (let i = 0; i < pad.length; i += blockSize) {
        const block = pad.subarray(i, i + blockSize);
        const enc = aes.encrypt(block);
        out.set(enc, i);
      }
      return out;
    },
    decrypt(data: Uint8Array): Uint8Array {
      if (data.length % blockSize !== 0) {
        throw new Error("Invalid ciphertext length");
      }
      const out = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i += blockSize) {
        const block = data.subarray(i, i + blockSize);
        const dec = aes.decrypt(block);
        out.set(dec, i);
      }
      return pkcs7().decode(out);
    },
  };
}

export function rc4(data: Uint8Array, key: Uint8Array): Uint8Array {
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i]! + key[i % key.length]!) & 0xff;
    [S[i]!, S[j]!] = [S[j]!, S[i]!];
  }

  const S2 = Array.from(S, (_, i) => {
    return S[(S[i]! + S[(i + S[i]!) & 0xff]!) & 0xff];
  });

  const result = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    const K = S2[(i + 1) % 256]!;
    result[i] = data[i]! ^ (i === data.length - 1 ? 0 : K);
  }

  return result;
}

function pkcs7() {
  const blockSize = 16;
  return {
    encode(data: Uint8Array): Uint8Array {
      const remain = data.length % blockSize;
      const out = new Uint8Array(data.length + blockSize - remain);
      out.set(data);
      out.fill(blockSize - remain, data.length);
      return out;
    },
    decode(data: Uint8Array): Uint8Array {
      if (data.length === 0 || data.length % blockSize !== 0) {
        throw new Error("Invalid padded length");
      }

      const len = data[data.length - 1]!;
      if (len <= 0 || len > blockSize) {
        throw new Error("Invalid padding length");
      }

      for (let i = data.length - len; i < data.length; i++) {
        if (data[i] === len) continue;
        throw new Error("Invalid padding bytes");
      }

      return data.subarray(0, data.length - len);
    },
  };
}

function createSBOX(gf: ReturnType<typeof createGF>): {
  get(i: number): number;
  inv(i: number): number;
} {
  const { SBOX, INV_SBOX } = ((createSBOX as any).__const__ ??= (() => {
    const SBOX = new Uint8Array(256);
    const INV_SBOX = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      SBOX[i] = genSbox(i);
    }

    for (let i = 0; i < 256; i++) {
      INV_SBOX[SBOX[i]!] = i;
    }
    return { SBOX, INV_SBOX };
    function genSbox(x: number): number {
      const y = x === 0 ? 0 : gf.inv(x);
      let s = 0;
      for (let i = 0; i < 8; i++) {
        const bit =
          ((y >> i) & 1) ^
          ((y >> ((i + 4) % 8)) & 1) ^
          ((y >> ((i + 5) % 8)) & 1) ^
          ((y >> ((i + 6) % 8)) & 1) ^
          ((y >> ((i + 7) % 8)) & 1) ^
          ((0x63 >> i) & 1);
        s |= bit << i;
      }
      return s;
    }
  })());

  return {
    get(i: number): number {
      return SBOX[i]!;
    },
    inv(i: number): number {
      return INV_SBOX[i]!;
    },
  };
}

function createGF() {
  const cache = new Map<number, Uint8Array>(
    [2, 3, 9, 11, 13, 14].map((x) => {
      return [x, new Uint8Array(256)];
    }),
  );

  for (let i = 0; i < 256; i++) {
    cache.forEach((u8, x) => {
      u8[i] = gfMul(i, x);
    });
  }

  return {
    inv: gfInverse,
    pow: gfPow,
    mul: (a: number, b: number): number => {
      if (a >= 0 && a < 256) {
        const u8 = cache.get(b);
        if (u8) return u8[a]!;
      }
      return gfMul(a, b);
    },
  };
  function gfInverse(a: number): number {
    if (a === 0) return 0;
    return gfPow(a, 254);
  }
  function gfPow(a: number, power: number): number {
    let result = 1;
    while (power > 0) {
      if (power & 1) result = gfMul(result, a);
      a = gfMul(a, a);
      power >>>= 1;
    }
    return result;
  }
  function gfMul(a: number, b: number): number {
    a &= 0xff;
    b &= 0xff;

    let result = 0;

    for (let i = 0; i < 8; i++) {
      if (b & 1) {
        result ^= a;
      }

      const hiBit = a & 0x80;

      a = (a << 1) & 0xff;

      if (hiBit) {
        a ^= 0x1b;
      }

      b >>>= 1;
    }

    return result & 0xff;
  }
}

function keyExpansion(opts: { key: Uint8Array; sbox: ReturnType<typeof createSBOX> }): Uint32Array[] {
  const { key, sbox } = opts;

  if (![16, 24, 32].includes(key.length)) {
    throw new Error("Invalid key length");
  }

  const Nk = key.length / 4;
  const Nr = Nk + 6;
  const w = new Uint32Array(Nk * (1 + Nr));

  for (let i = 0; i < Nk; i++) {
    w[i] = (key[4 * i + 0]! << 24) | (key[4 * i + 1]! << 16) | (key[4 * i + 2]! << 8) | (key[4 * i + 3]! << 0);
  }

  for (let i = Nk; i < w.length; i++) {
    let tmp = w[i - 1]!;

    if (i % Nk === 0) {
      tmp = rot(tmp);
      tmp = sub(tmp);
      tmp ^= rcon(i / Nk);
    } else if (Nk > 6 && i % Nk === 4) {
      tmp = sub(tmp);
    }

    w[i] = w[i - Nk]! ^ tmp;
  }

  const roundKeys: Uint32Array[] = [];
  for (let i = 0; i <= Nr; i++) {
    roundKeys.push(w.subarray(i * 4, (i + 1) * 4));
  }
  return roundKeys;

  function rot(word: number): number {
    return ((word << 8) | (word >>> 24)) >>> 0;
  }

  function sub(word: number): number {
    return (
      (sbox.get((word >>> 24) & 0xff) << 24) |
      (sbox.get((word >>> 16) & 0xff) << 16) |
      (sbox.get((word >>> 8) & 0xff) << 8) |
      (sbox.get((word >>> 0) & 0xff) << 0)
    );
  }

  function rcon(i: number) {
    let c = 1;
    for (let j = 1; j < i; j++) {
      c <<= 1;
      if (c & 0x100) c ^= 0x11b;
    }
    return c << 24;
  }
}

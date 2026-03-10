const SECRET = process.env.SECRET ?? "secret";
const encoder = new TextEncoder();

export type AuthPayload = {
  username: string;
};

export class AuthService {
  static signToken(payload: AuthPayload) {
    return signJWT(payload, SECRET);
  }
  static verifyToken(token: string): Promise<AuthPayload> {
    return verifyJWT(token, SECRET);
  }
}

async function signJWT(payload: object, secret: string, expiresInSec: number = 3600) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };

  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const bodyEncoded = base64urlEncode(JSON.stringify(body));

  const unsigned = `${headerEncoded}.${bodyEncoded}`;

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(unsigned));
  const signatureEncoded = base64urlEncode(signature);

  return `${unsigned}.${signatureEncoded}`;
}

async function verifyJWT(token: string, secret: string) {
  const [headerB64, payloadB64, sigB64] = token.split(".");
  if (!headerB64 || !payloadB64 || !sigB64) throw new Error("Invalid token format");

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "verify",
  ]);

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlDecode(sigB64),
    encoder.encode(`${headerB64}.${payloadB64}`),
  );

  if (!valid) throw new Error("Invalid signature");

  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error("Token expired");

  return payload;
}

function base64urlEncode(data: ArrayBuffer | string) {
  const bytes = typeof data === "string" ? encoder.encode(data) : new Uint8Array(data);
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str + pad);
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

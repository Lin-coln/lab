/**
 * SSE (Server-Sent Events) framing helpers — aligned with WHATWG HTML “server-sent events”:
 * - **Event boundary**: dispatch happens after a **blank line** (two consecutive line terminators).
 *   Typical byte sequences: `\n\n` when field lines end with LF, or `\r\n\r\n` when lines use CRLF.
 * - **Field lines** within an event: one line terminator per line (`iterateLines`).
 *
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html
 */

/** WHATWG-typical event boundaries only (LF/LF and CRLF/CRLF blank lines). */
const SSE_CHUNK_PATTERNS: Uint8Array[] = [
  new Uint8Array([0x0d, 0x0a, 0x0d, 0x0a]), // \r\n\r\n
  new Uint8Array([0x0a, 0x0a]), // \n\n
  // new Uint8Array([0x0d, 0x0d]), // \r\r
];

const SSE_LINE_PATTERNS = [
  new Uint8Array([0x0d, 0x0a]), // \r\n
  new Uint8Array([0x0a]), // \n
  new Uint8Array([0x0d]), // \r
];

export type SSEMessage = {
  id?: string;
  retry?: number;
  event: string;
  data: string;
};

export async function* iterateSSE(iterable: AsyncIterable<Uint8Array<ArrayBuffer> | ArrayBuffer>) {
  const decoder = new TextDecoder();
  for await (const chunk of iterateChunks(iterable, SSE_CHUNK_PATTERNS)) {
    yield decodeMessage(decoder, chunk, SSE_LINE_PATTERNS);
  }
}

async function* iterateChunks(
  iterable: AsyncIterable<Uint8Array<ArrayBuffer> | ArrayBuffer>,
  patterns: Uint8Array[],
): AsyncGenerator<Uint8Array<ArrayBuffer>> {
  let data = new Uint8Array();
  const extendableAtTail = buildPatternsExtendableAtTail(patterns);

  for await (const x of iterable) {
    if (x === null) continue;

    const chunk: Uint8Array<ArrayBuffer> = x instanceof ArrayBuffer ? new Uint8Array(x) : x;
    let next = new Uint8Array(data.length + chunk.length);
    next.set(data);
    next.set(chunk, data.length);
    data = next;

    let match: { index: number; pattern: Uint8Array } | null;
    while (true) {
      match = findPatternMatch(data, patterns);
      if (!match) break;

      const { index, pattern } = match;
      const end = index + pattern.length;

      // Same as iterateLines: if a shorter delimiter matches at buffer tail but a longer pattern shares this prefix, wait for more bytes.
      if (end === data.length && extendableAtTail.has(pattern)) {
        break;
      }

      // slice: detached copies so consumers do not retain large backing buffers (cf. Anthropic streaming.ts).
      yield data.slice(0, index);
      data = data.slice(end);
    }
  }

  if (data.length) yield data;
}

function decodeMessage(decoder: TextDecoder, chunk: Uint8Array<ArrayBuffer>, patterns: Uint8Array[]): SSEMessage {
  // Split bytes into field lines using provided line terminator patterns.
  // `findPatternMatch` ensures "longest match at same index" (so CRLF wins over CR).
  const lines: string[] = [];
  let rest = chunk;
  while (rest.length) {
    const match = findPatternMatch(rest, patterns);
    if (!match) break;
    lines.push(decoder.decode(rest.subarray(0, match.index)));
    rest = rest.subarray(match.index + match.pattern.length);
  }
  if (rest.length) {
    lines.push(decoder.decode(rest));
  }

  let id: string | undefined;
  let event: string | undefined;
  let retry: number | undefined;
  const dataLines: string[] = [];
  for (const line of lines) {
    // Blank line terminates an event; if present inside `chunk`, ignore it here.
    if (!line.length) continue;
    // Comment line
    if (line.startsWith(":")) continue;

    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "data") {
      dataLines.push(value);
      continue;
    }
    if (field === "id") {
      id = value;
      continue;
    }
    if (field === "event") {
      event = value;
      continue;
    }
    if (field === "retry") {
      const n = Number.parseInt(value, 10);
      if (!Number.isNaN(n)) retry = n;
      continue;
    }
  }

  return {
    ...(id ? { id } : {}),
    ...(retry ? { retry } : {}),
    event: event ?? "message",
    data: dataLines.join("\n"),
  };
}

function findPatternMatch(buffer: Uint8Array, patterns: Uint8Array[]): { index: number; pattern: Uint8Array } | null {
  const len = buffer.length;

  for (let i = 0; i < len; i++) {
    let matchedPattern: Uint8Array | null = null;

    for (const pattern of patterns) {
      if (i + pattern.length > len) continue;
      if (!pattern.every((x, ofs) => x === buffer[i + ofs])) continue;
      if (!matchedPattern || pattern.length > matchedPattern.length) {
        matchedPattern = pattern;
      }
    }

    if (matchedPattern) {
      return { index: i, pattern: matchedPattern };
    }
  }

  return null;
}

/**
 * Which entries in `patterns` are a strict prefix of some longer entry (by byte equality).
 * `findPatternMatch` returns the same Uint8Array reference as one of `patterns[i]`, so hot path can use `set.has(pattern)`.
 */
function buildPatternsExtendableAtTail(patterns: Uint8Array[]): Set<Uint8Array> {
  const extendable = new Set<Uint8Array>();

  for (let i = 0; i < patterns.length; i++) {
    const prefix = patterns[i]!;
    for (let j = 0; j < patterns.length; j++) {
      if (i === j) continue;
      const candidate = patterns[j]!;
      if (candidate.length <= prefix.length) continue;
      let isPrefix = true;
      for (let k = 0; k < prefix.length; k++) {
        if (candidate[k] !== prefix[k]) {
          isPrefix = false;
          break;
        }
      }
      if (isPrefix) {
        extendable.add(prefix);
        break;
      }
    }
  }

  return extendable;
}

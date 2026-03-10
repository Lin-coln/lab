export interface Source {
  readonly url: string;
  readonly length: number;
  opened(): Promise<void>;
  loadChunk(start: number, end: number): Promise<void>;
  dispose(): void;
}

export function createMediaSource(src: string, opts: { readonly mime: string }): Source {
  const mediaSource = new MediaSource();
  const url = URL.createObjectURL(mediaSource);
  let buf!: SourceBuffer;
  let length!: number;

  let resolveOpen!: () => void;
  const openPromise = new Promise<void>((resolve) => void (resolveOpen = resolve));

  mediaSource.addEventListener("sourceopen", async () => {
    const fetched = await prefetchContent({ src });
    console.log({ fetched });

    buf = mediaSource.addSourceBuffer(opts.mime);
    length = fetched.contentLength;
    await loadChunk(0, 2 * 1024 ** 2);
    resolveOpen();
  });

  let loading: boolean = false;

  return {
    url,
    get length() {
      return length;
    },
    loadChunk,
    dispose,
    opened: () => openPromise,
  };

  async function loadChunk(start: number, end: number) {
    if (start >= length) {
      mediaSource.endOfStream();
      return;
    }

    if (loading) return;

    loading = true;
    const chunk = await fetchChunk({ src, start, end });
    // this.offset += chunk.byteLength;

    console.log("ensureUpdateEnd");
    await ensureUpdateEnd(buf);
    console.log("appendBuffer");
    buf.appendBuffer(chunk);
    console.log("loadChunk end");
    loading = false;
  }
  function dispose() {
    if (mediaSource.readyState === "open") {
      mediaSource.endOfStream();
      if (buf) {
        buf.abort();
        const buffered = buf.buffered;
        if (buffered.length) {
          buf.remove(0, buffered.end(buffered.length - 1));
        }
      }
    }
    URL.revokeObjectURL(url);
  }
}

export function bindVideoSource({ element: video, src }: { readonly element: HTMLVideoElement; readonly src: Source }) {
  const preloadThreshold = 30;
  video.src = src.url;
  video.addEventListener("timeupdate", handleTimeUpdate);
  // video.addEventListener("seeking", handleSeeking);
  return () => {
    video.removeEventListener("timeupdate", handleTimeUpdate);
    // video.removeEventListener("seeking", handleSeeking);
  };
  async function handleTimeUpdate() {
    await src.opened();
    const idx = findBufferedRangeIndex(video.buffered, video.currentTime);

    let from: number;
    if (idx >= 0) {
      const bufEnd = video.buffered.end(idx);
      const remain = bufEnd - video.currentTime;
      if (remain >= preloadThreshold) return;
      from = bufEnd;
    } else {
      from = Math.max(0, video.currentTime - 5);
    }

    const len = src.length;
    const chunkSize = 2 * 1024 ** 2;
    const start = Math.floor(len * (from / video.duration));
    const end = Math.ceil(Math.min(len, start + chunkSize));

    if (!len) return;
    if (!video.duration || isNaN(video.duration)) return;
    console.log("load chunk", start, end);

    await src.loadChunk(start, end);
  }
  function handleSeeking() {}
}

async function prefetchContent(opts: { src: string }) {
  const resp = await fetch(opts.src, {
    headers: {
      Range: `bytes=0-`,
    },
  });
  const contentLength = resp.headers.get("content-length");
  if (!contentLength) {
    throw new Error(`failed to prefetch - content-length not found`);
  }
  return {
    contentLength: parseInt(contentLength),
  };
}

async function fetchChunk(opts: { src: string; start?: number; end?: number }) {
  const start = opts.start ?? 0;
  const end = opts.end;
  const resp = await fetch(opts.src, {
    headers: {
      Range: `bytes=${start}-${end}`,
    },
  });
  return await resp.arrayBuffer();
}

async function ensureUpdateEnd(buf: SourceBuffer) {
  if (!buf.updating) return;
  return await new Promise<void>((resolve) => {
    const onUpdate = () => {
      buf.removeEventListener("updateend", onUpdate);
      resolve();
    };
    buf.addEventListener("updateend", onUpdate);
  });
}

function findBufferedRangeIndex(ranges: TimeRanges, time: number): number {
  for (let i = 0; i < ranges.length; i++) {
    const s = ranges.start(i);
    const e = ranges.end(i);
    if (time >= s && time <= e) return i;
  }
  return -1;
}

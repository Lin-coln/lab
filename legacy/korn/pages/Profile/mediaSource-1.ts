type VideoSourceOptions = {
  readonly src: string;
  readonly mime: string;
};

class VideoSource {
  readonly src: string;
  readonly mime: string;

  readonly #mediaSource: MediaSource;
  readonly url: string;
  #buffer!: SourceBuffer;
  #contentLength!: number;

  offset: number = 0;
  chunkSize: number = 2 * 1024 ** 2;

  constructor(opts: VideoSourceOptions) {
    this.src = opts.src;
    this.mime = opts.mime;

    this.#mediaSource = new MediaSource();
    this.url = URL.createObjectURL(this.#mediaSource);
    this.#mediaSource.addEventListener("sourceopen", async () => {
      const data = await prefetchContent({ src: this.src });
      this.#contentLength = data.contentLength;
      this.#buffer = this.#mediaSource.addSourceBuffer(this.mime);

      // init
      await this.loadChunk();

      //
    });
  }

  public get length() {
    return this.#contentLength;
  }

  #loading: boolean = false;
  public async loadChunk(len: number = this.chunkSize) {
    if (this.offset >= this.length && this.#mediaSource.readyState === "open") {
      this.#mediaSource.endOfStream();
      return;
    }

    if (this.#loading) return;

    this.#loading = true;
    await this.#loadChunk(len);
    this.#loading = false;
  }
  async #loadChunk(len: number) {
    const start = this.offset;
    const end = start + len - 1;
    const chunk = await fetchChunk({
      src: this.src,
      start,
      end,
    });
    this.offset += chunk.byteLength;
    await ensureUpdateEnd(this.#buffer);
    this.#buffer.appendBuffer(chunk);
  }

  public dispose() {
    if (this.#mediaSource.readyState === "open") {
      this.#mediaSource.endOfStream();
      if (this.#buffer) {
        this.#buffer.abort();
        const buffered = this.#buffer.buffered;
        if (buffered.length) {
          this.#buffer.remove(0, buffered.end(buffered.length - 1));
        }
      }
    }
    URL.revokeObjectURL(this.url);
  }
}

function bindVideoSource(video: HTMLVideoElement, src: VideoSource) {
  video.src = src.url;
  video.addEventListener("timeupdate", handleTimeUpdate);
  video.addEventListener("seeking", handleSeeking);
  return () => {
    video.removeEventListener("timeupdate", handleTimeUpdate);
    video.removeEventListener("seeking", handleSeeking);
  };
  function handleTimeUpdate() {}
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

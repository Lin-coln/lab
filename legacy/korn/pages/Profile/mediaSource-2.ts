type SourceBufferLike = SourceBuffer & {
  appendBuffer(data: ArrayBuffer): void;
};

interface StreamPlayerOptions {
  url: string; // 视频 URL
  video: HTMLVideoElement; // 目标 video 元素
  mime?: string; // 默认 mime 类型
  chunkSize?: number; // 每次加载的字节数（默认 2MB）
  preloadThreshold?: number; // 缓冲小于多少秒时加载下一块（默认 5s）
}

class StreamPlayer {
  private mediaSource: MediaSource;
  private sourceBuffer!: SourceBufferLike;
  private fileSize = 0;
  private offset = 0;
  private readonly url: string;
  private readonly video: HTMLVideoElement;
  private readonly mime: string;
  private readonly chunkSize: number;
  private readonly preloadThreshold: number;
  private loading = false;

  constructor(options: StreamPlayerOptions) {
    this.url = options.url;
    this.video = options.video;
    this.mime = options.mime ?? 'video/mp4; codecs="avc1.64001f, mp4a.40.2"';
    this.chunkSize = options.chunkSize ?? 2 * 1024 * 1024;
    this.preloadThreshold = options.preloadThreshold ?? 5;

    this.mediaSource = new MediaSource();
    this.video.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener("sourceopen", this.handleSourceOpen);
  }

  private handleSourceOpen = async () => {
    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime) as SourceBufferLike;
    this.sourceBuffer.addEventListener("updateend", this.tryLoadNext);

    // 初次加载
    await this.loadNextChunk();

    // 播放器时间更新时检测是否需要预加载
    this.video.addEventListener("timeupdate", this.tryLoadNext);
    this.video.addEventListener("seeking", this.handleSeek);
  };

  private async fetchChunk(start: number, end: number): Promise<ArrayBuffer> {
    const res = await fetch(this.url, {
      headers: { Range: `bytes=${start}-${end}` },
    });

    if (!this.fileSize) {
      const contentRange = res.headers.get("Content-Range");
      const match = contentRange?.match(/bytes\s+\d+-\d+\/(\d+)/);
      if (match) this.fileSize = parseInt(match[1], 10);
    }

    return await res.arrayBuffer();
  }

  private async loadNextChunk(): Promise<void> {
    if (this.loading || (this.fileSize && this.offset >= this.fileSize)) {
      if (this.fileSize && this.offset >= this.fileSize && this.mediaSource.readyState === "open") {
        this.mediaSource.endOfStream();
      }
      return;
    }

    this.loading = true;
    const end = this.offset + this.chunkSize - 1;
    const chunk = await this.fetchChunk(this.offset, end);
    this.offset += chunk.byteLength;

    await this.appendBuffer(chunk);
    this.loading = false;
  }

  private async appendBuffer(chunk: ArrayBuffer): Promise<void> {
    if (this.sourceBuffer.updating) {
      await new Promise<void>((resolve) => {
        const onUpdate = () => {
          this.sourceBuffer.removeEventListener("updateend", onUpdate);
          resolve();
        };
        this.sourceBuffer.addEventListener("updateend", onUpdate);
      });
    }

    this.sourceBuffer.appendBuffer(chunk);
  }

  private tryLoadNext = async (): Promise<void> => {
    const { currentTime, buffered } = this.video;
    if (buffered.length === 0) return;

    const bufferEnd = buffered.end(buffered.length - 1);
    const remain = bufferEnd - currentTime;

    if (remain < this.preloadThreshold && this.offset < this.fileSize) {
      await this.loadNextChunk();
    }
  };

  private handleSeek = async (): Promise<void> => {
    if (!this.fileSize || !this.video.duration) return;

    // 通过比例估算字节偏移（简单版本）
    const percent = this.video.currentTime / this.video.duration;
    this.offset = Math.floor(this.fileSize * percent);

    if (this.mediaSource.readyState === "open") {
      this.sourceBuffer.abort();
      this.sourceBuffer.remove(0, this.video.duration);
    }

    await this.loadNextChunk();
  };

  public destroy(): void {
    this.video.removeEventListener("timeupdate", this.tryLoadNext);
    this.video.removeEventListener("seeking", this.handleSeek);

    if (this.mediaSource.readyState === "open") {
      this.mediaSource.endOfStream();
    }

    URL.revokeObjectURL(this.video.src);
  }
}

const type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
// const type = `video/mp4; codecs="avc1.64001F, mp4a.40.2"`;

export function setVideo(el: HTMLVideoElement) {
  const mediaSource = new MediaSource();
  console.log("setVideo", mediaSource.readyState);
  mediaSource.addEventListener("sourceopen", async () => {
    console.log("sourceopen", mediaSource.readyState);
    const buf = mediaSource.addSourceBuffer(type);
    buf.addEventListener("updateend", () => {
      console.log("updateend", mediaSource.readyState);
      mediaSource.endOfStream();
      // el.play();
      //console.log(mediaSource.readyState); // ended
    });
    const resp = await fetch("/api/video");
    buf.appendBuffer(await resp.arrayBuffer());
  });
  el.src = URL.createObjectURL(mediaSource);

  return () => {
    // ....
  };
}

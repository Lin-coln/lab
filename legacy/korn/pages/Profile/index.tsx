import { Button } from "ui";
import { fetchProfile, signOut, useAccountStore } from "../stores/account";
import cx from "clsx";
import { use, useEffect, useRef } from "react";
import { bindVideoSource, createMediaSource, type Source } from "./mediaSource";
import { setVideo } from "./setVideo";

const profilePromise = fetchProfile();

export default function Profile() {
  const account = useAccountStore();
  const profile: any = use(profilePromise);

  const srcRef = useRef<Source>(null as any);
  if (!srcRef.current) {
    srcRef.current = createMediaSource("/api/video", {
      mime: `video/mp4; codecs="avc1.42E01E, mp4a.40.2"`,
    });
  }
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // return bindVideoSource({ element: video, src: srcRef.current });
    return setVideo(video);
  }, [videoRef.current]);

  return (
    <div
      className={cx(
        "max-w-full w-[1080px] min-h-screen",
        "text-wrap break-all",
        "mx-auto",
        "flex flex-col justify-center items-center",
        "gap-2",
      )}
    >
      <div className={cx("mt-16 mb-2", "text-2xl", "ms-4 me-auto")}>Video</div>
      <video ref={videoRef} controls className={cx("rounded-md", "max-w-full", "h-[480px]", "mb-16")}>
        {/*<source type="video/mp4" src="/api/video" />*/}
        Your browser does not support the video tag.
      </video>

      <div
        className={cx("flex flex-col justify-center items-start", "w-[480px] py-2 px-4 rounded-md", "bg-neutral-50/5")}
      >
        <div className={cx("text-base")}> {profile.username}</div>
        <div className={cx("text-xs opacity-60", "-mt-1")}>username</div>
      </div>

      <Button
        className={["w-[120px]", "mt-8 mb-16"]}
        key="sign_out"
        label="Sign Out"
        onClick={async () => {
          await signOut();
        }}
      />
    </div>
  );
}

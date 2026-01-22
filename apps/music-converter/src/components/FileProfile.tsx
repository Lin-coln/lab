import { Button } from "ui";
import { useAppStore, deleteTarget, parseInfo } from "@/stores/app.store.ts";
import cx from "clsx";
import { FaXmark } from "react-icons/fa6";
import { BsFileEarmarkFill } from "react-icons/bs";
import { LazyImage } from "@/components/LazyImage.tsx";

export function FileProfile(props: { id: string }) {
  const { targets, info: infoDict } = useAppStore();
  const target = targets[props.id]!;
  const info = infoDict[props.id];

  return (
    <div
      className={cx(
        "flex flex-row items-center",
        "bg-neutral-400/5",
        "max-w-full min-h-20",
        "rounded-3xl p-4", //
        "hover:ring-1 ring-neutral-50/10",
      )}
    >
      <div className={cx("p-1 rounded-2xl me-1 self-start")}>
        {!info ? (
          <BsFileEarmarkFill size="100%" className="size-10 text-neutral-50/20" />
        ) : (
          <LazyImage
            className={["size-24 text-neutral-50/20", "rounded-xl", "ring-2 ring-neutral-500/50"]}
            alt={info.album.name}
            src={info.album.image}
          />
        )}
      </div>
      <div className="grow shrink w-0 ms-2">
        {!info ? (
          <>
            <div className="font-bold truncate mb-1">{target.name}</div>
            <div className="text-xs text-neutral-50/40 ">size: {target.size}</div>
          </>
        ) : (
          <>
            <div className="text-xs truncate -mt-1 mb-0.5 text-neutral-50/20">{info.album.name}</div>
            <div className="font-bold truncate mb-1">{info.name}</div>
            <div className="text-xs truncate text-neutral-50/40">{info.artists.join(" / ")}</div>
            <div className="text-xs truncate text-neutral-50/40 mt-2">filename: {target.name}</div>
            <div className="text-xs truncate text-neutral-50/40">size: {target.size}</div>
          </>
        )}
      </div>
      <div className="flex flex-row justify-end items-center shrink-0 w-fit ms-1 gap-1 self-start h-12">
        {!info ? (
          <Button
            variant="subtle"
            label="convert"
            className={["text-neutral-50/70 rounded-full"]}
            onClick={() => parseInfo(target.id)}
          />
        ) : (
          <Button
            variant="subtle"
            label="download"
            className={["text-neutral-50/70 rounded-full"]}
            onClick={() => {
              let filename = `${info.name}.mp3`;
              info.artists.length && (filename = `${info.artists[0]} - ${filename}`);
              saveFile(info.data, { filename, type: "audio/mpeg" });
            }}
          />
        )}
        <Button
          variant="subtle"
          icon={<FaXmark className="size-4" />}
          className={["text-neutral-50/70 rounded-full size-9"]}
          onClick={() => deleteTarget(target.id)}
        />
      </div>
    </div>
  );
}

function saveFile(data: Uint8Array<ArrayBuffer>, { filename, type }: { filename: string; type: string }) {
  let url: string | null = URL.createObjectURL(new Blob([data], { type }));
  let a: HTMLAnchorElement | null = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
  a = null;
  url = null;
}

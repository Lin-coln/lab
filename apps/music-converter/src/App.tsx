import { useInitializeEffects } from "@/hooks/useInitializeEffects.ts";
import { appendTarget, useAppStore } from "@/stores/app.store.ts";
import { FileProfile } from "@/components/FileProfile.tsx";
import cx from "clsx";
import { Header } from "@/components/Header.tsx";
import { Button } from "ui";
import { FaPlus } from "react-icons/fa6";
import { useEffect, useRef, useState } from "react";
import { MdFace } from "react-icons/md";
import { BiLinkExternal } from "react-icons/bi";

export default function App() {
  useInitializeEffects();

  const { targets } = useAppStore();
  const targetArr = Object.keys(targets);

  const filePicker = useFilePicker(async (files: FileList) => {
    for (const file of Array.from(files)) {
      await appendTarget(file);
    }
  });

  return (
    <>
      <div className={cx("flex flex-col w-full min-h-viewport justify-start items-center")}>
        {targetArr.length ? (
          <div className={cx("max-w-3xl mx-auto w-full", "my-16 px-4", "flex flex-col gap-4")}>
            {targetArr.map((id) => (
              <FileProfile key={id} id={id} />
            ))}
          </div>
        ) : (
          <div className={cx("max-w-3xl mx-auto w-full grow", "px-4", "flex flex-col justify-center items-center")}>
            <div className={cx("truncate text-xs text-neutral-50/60", "mb-4")}>
              select your audio file and convert to mp3
            </div>
            <Button
              icon={<FaPlus size={16} className="mx-1" />}
              label={<div>select files</div>}
              size="large"
              onClick={() => {
                filePicker.open();
              }}
            />
          </div>
        )}
      </div>
      <Header
        menu={
          <>
            <Button
              variant="subtle"
              size="large"
              className={["w-full h-fit", "p-2"]}
              label={
                <div className="flex flex-row w-full items-center">
                  <Avatar />
                  <div className="flex flex-col text-start ml-3">
                    <div className="truncate text-sm text-neutral-50/60">LinColn</div>
                    <div className="truncate text-xs text-neutral-50/40 font-normal">author</div>
                  </div>
                  <BiLinkExternal className="ml-auto text-neutral-50/40" />
                </div>
              }
              onClick={() => {
                window.open("https://github.com/Lin-coln", "blank");
              }}
            />
            <div className="text-xs p-1 mt-1 text-neutral-50/60 break-all">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Culpa facilis id tenetur. Debitis, facilis,
              vitae? Aspernatur aut explicabo facere maiores repellendus! Beatae ipsum, minus! Ab exercitationem
              inventore laudantium provident veniam.
            </div>
          </>
        }
        actions={
          Boolean(targetArr.length) && (
            <Button
              variant="subtle"
              icon={<FaPlus size={16} className="mx-1" />}
              size="medium"
              label={<div>select files</div>}
              className={["text-neutral-50/70"]}
              onClick={() => {
                filePicker.open();
              }}
            />
          )
        }
      />

      {filePicker.renderInput()}
    </>
  );
}

function useFilePicker(onChange: (files: FileList) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const renderInput = () => (
    <input
      className="hidden"
      type="file"
      multiple={true}
      ref={inputRef}
      onChange={(evt) => {
        let files = evt.target.files;
        if (files && files.length) {
          onChange(files);
        }
        evt.target.value = "";
      }}
    />
  );

  return {
    renderInput,
    open: () => inputRef.current?.click(),
  };
}

function Avatar() {
  const [avatar, setAvatar] = useState("");

  const fallbackContent = (
    <div className="flex items-center justify-center bg-default/50 text-foreground w-full h-full">
      <MdFace className="text-3xl text-neutral-500" />
    </div>
  );

  useEffect(() => {
    void (async () => {
      const resp = await fetch(`https://api.github.com/users/lin-coln`);
      const { avatar_url } = await resp.json();
      setAvatar(avatar_url);
    })();
  }, []);

  return (
    <div className={cx("w-8 h-8 text-large shrink-0", "rounded-full overflow-hidden")}>
      {Boolean(avatar) && <img src={avatar} alt="avatar" />}
      {Boolean(!avatar) && fallbackContent}
    </div>
  );
}

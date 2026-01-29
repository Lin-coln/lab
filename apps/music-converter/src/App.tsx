import { useInitializeEffects } from "@/hooks/useInitializeEffects.ts";
import { appendTarget, useAppStore } from "@/stores/app.store.ts";
import { FileProfile } from "@/components/FileProfile.tsx";
import cx from "clsx";
import { Header } from "@/components/Header.tsx";
import { Button } from "ui";
import { FaPlus } from "react-icons/fa6";
import { useRef } from "react";

export default function App() {
  useInitializeEffects();

  const { targets } = useAppStore();
  const targetArr = Object.keys(targets);

  const filePicker = useFilePicker(async (files: FileList) => {
    for (const file of Array.from(files)) {
      await appendTarget(file);
    }
  });

  const selectButton = (
    <Button
      variant={targetArr.length ? "subtle" : "standard"}
      icon={<FaPlus size={16} className="mx-1" />}
      label={<div className="-translate-y-px me-1.5">select files</div>}
      className={["h-11", "rounded-2xl", targetArr.length ? "text-neutral-50/70" : "text-neutral-50/80"]}
      onClick={() => {
        filePicker.open();
      }}
    />
  );

  return (
    <>
      <div className={cx("flex flex-col w-full min-h-viewport justify-start", "app-region-drag")}>
        {targetArr.length ? (
          <div className={cx("app-region-drag", "max-w-3xl mx-auto w-full", "my-18 px-4", "flex flex-col gap-4")}>
            {targetArr.map((id) => {
              return <FileProfile key={id} id={id} />;
            })}
          </div>
        ) : (
          <div
            className={cx(
              "app-region-drag",
              "max-w-3xl mx-auto w-full grow",
              "px-4",
              "flex flex-col justify-center items-center",
            )}
          >
            <div className={cx("truncate text-xs text-neutral-50/60", "mb-4")}>
              select your audio file and convert to mp3
            </div>
            {selectButton}
          </div>
        )}
      </div>

      <Header actions={Boolean(targetArr.length) && selectButton} />

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

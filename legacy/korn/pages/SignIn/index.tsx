import { Button, Input } from "ui";
import cx from "clsx";
import { useState } from "react";
import { signIn } from "../stores/account.ts";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className={cx("max-w-full w-[1080px] min-h-screen", "mx-auto", "flex flex-col justify-start items-center")}>
      <div className={cx("h-0 grow", "flex flex-col justify-center items-center", "gap-2")}>
        <div className={cx("ms-2 me-auto -mb-1", "text-xs opacity-60")}>Username:</div>
        <Input
          value={username}
          onValueChange={(val) => {
            setUsername(val);
          }}
        />
        <div className={cx("ms-2 me-auto -mb-1", "text-xs opacity-60")}>Password:</div>
        <Input
          value={password}
          onValueChange={(val) => {
            setPassword(val);
          }}
        />
        <Button
          className={["mt-2", "w-full"]}
          label="Sign In"
          onClick={async () => {
            const _username = username.trim();
            const _password = password.trim();
            if (!_username || !_password) return;
            await signIn(_username, _password);
          }}
        />
      </div>
    </div>
  );
}

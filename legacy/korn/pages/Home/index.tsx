import { pushRoute } from "../routes.ts";
import { useAccountStore } from "../stores/account.ts";
import { useEffect } from "react";

export default function Home() {
  const account = useAccountStore();

  const isSignedIn = Boolean(account.token);

  useEffect(() => {
    if (isSignedIn) {
      pushRoute("/profile");
    } else {
      pushRoute("/sign_in");
    }
  }, [isSignedIn]);

  return null;
}

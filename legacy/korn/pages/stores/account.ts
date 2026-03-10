import { proxy, useSnapshot } from "valtio";
import { watch } from "valtio/utils";
import { pushRoute } from "../routes.ts";
import * as utils from "./utils.ts";

type AccountStore = {
  token: string;
};

const accountStore = proxy<AccountStore>({
  token: localStorage.getItem("tmp.signed_in.token") ?? "",
});

export const useAccountStore = () => useSnapshot(accountStore);

const cleanup = watch((get) => {
  get(accountStore);
  const token = accountStore.token;
  if (!token) {
    localStorage.removeItem("tmp.signed_in.token");
  } else {
    localStorage.setItem("tmp.signed_in.token", token);
  }
  pushRoute("/");
  return () => {
    // ..
  };
});
import.meta.hot.dispose(cleanup);

export async function signIn(username: string, password: string) {
  const { token } = await utils.post("/api/auth/sign_in", {
    username,
    password,
  });

  accountStore.token = token;
}

export async function signOut() {
  await utils.sleep(100);
  accountStore.token = "";
}

export async function fetchProfile() {
  const profile = await utils.get("/api/user/profile", void 0, accountStore.token);
  return profile;
}

// import { createAPI } from "sokii";
//
// // type Routes = [
// //   { name: "api/video"; query: { name: "asd" }; get: "stream"; body: { username: number; password: string } },
// //   { name: "api/auth/sign_in"; body: { username: string; password: string }; post: { token: string } },
// //   { name: "api/auth/sign_out"; post: "ok" },
// // ];
// type Routes = RestAPI.ToRoutes<KornAPI.App>;
// type Route = Routes[keyof Routes & number];
//
// const baseUrl = "/";
// const kornAPI = createAPI.create((ctx) => {
//   return {
//     async fetch<R extends Route>(req: RestAPI.RouteRequest<R>) {
//       const { name, query, ...reqInit } = req as any;
//       const resp = await fetch(baseUrl + name, reqInit);
//     },
//   };
// });

import { authed } from "./authed.ts";

export const NAME = "/sign_out";

export const POST = authed((req) => {
  return new Response("ok");
});

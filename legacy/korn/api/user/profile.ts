import { authed } from "../auth/authed.ts";

export const NAME = "/profile";

export const GET = authed((req) => {
  return Response.json({ username: req.auth.username });
});

import { authed } from "../auth/authed";

export const NAME = "/profile";

export const GET = authed((req) => {
  return Response.json({ username: req.auth.username });
});

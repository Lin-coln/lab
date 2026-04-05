import type { BunRequest, RouterTypes, Server } from "bun";
import { type AuthPayload, AuthService } from "./service";

export function authed<T extends string>(
  handler: (req: BunRequest<T> & { auth: AuthPayload }, server: Server) => Response | Promise<Response>,
): RouterTypes.RouteHandler<T> {
  return async (req: BunRequest, server: Server) => {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response("Missing token", { status: 401 });
    }
    const token = auth.slice(7);
    try {
      (req as any).auth = await AuthService.verifyToken(token);
      return handler(req as any, server);
    } catch (e) {
      return new Response((e as Error).message, { status: 403 });
    }
  };
}

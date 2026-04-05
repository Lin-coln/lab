import { type BunRequest } from "bun";
import { AuthService } from "./service";

export const NAME = "/sign_in";

export async function POST(req: BunRequest) {
  const body: any = await req.json().catch(() => null);
  if (!body || !body.username || !body.password) {
    return new Response("Missing credentials", { status: 400 });
  }

  const { username, password } = body;
  if (username !== "lincoln" || password !== "888999") {
    return new Response("Invalid credentials", { status: 401 });
  }

  const token = await AuthService.signToken({ username });
  return Response.json({ token });
}

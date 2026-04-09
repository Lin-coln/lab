import type { Tool } from "@/core";

import bash from "./bash";

export async function loadTools(ctx: Tool.Context) {
  ctx.add(bash);
}

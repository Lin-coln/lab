import type { RouterTypes } from "bun";
import { toRouteEntries } from "./utils";

import * as auth from "./auth";
import * as user from "./user";
import * as video from "./video";

export const routes: Record<string, RouterTypes.RouteHandlerObject<any>> = Object.fromEntries(
  toRouteEntries({
    prefix: "/api",
    route: {
      NAME: "",
      NESTED: [auth, user, video],
    },
  }),
);

import { type BunRequest, type RouterTypes, type Server } from "bun";
import { type AuthPayload, AuthService } from "./service.ts";

import * as signIn from "./sign_in";
import * as signOut from "./sign_out";

export const NAME = "/auth";
export const NESTED = [signIn, signOut];

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { getApiUrl } from "./env";

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  plugins: [adminClient()],
});

export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];

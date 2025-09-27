import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [adminClient()],
});

export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];

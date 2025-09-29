import { betterAuthMacro } from "@/lib/auth";
import Elysia from "elysia";

export const wiki = new Elysia({ prefix: "/wiki" }).use(betterAuthMacro).guard(
  {
    auth: true,
    role: "admin",
  },
  (app) =>
    app
      .get(
        "/private",
        ({ user }) => "This is a private wiki page, " + user?.email,
      )
      .get("/not-public", () => "This is not public"),
);

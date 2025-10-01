import { betterAuthMacro } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import Elysia from "elysia";
import { wikiArticles } from "./articles";

export const wiki = new Elysia({ prefix: "/wiki" })
  .use(betterAuthMacro)
  .use(wikiArticles)
  .get("/test-error", () => {
    throw new UnauthorizedError("Test error from route");
  })
  .guard(
    {
      auth: true,
      role: ["admin", "super_admin"],
    },
    (app) =>
      app
        .get(
          "/private",
          ({ user }) => "This is a private wiki page, " + user?.email,
        )
        .get("/not-public", () => "This is not public"),
  );

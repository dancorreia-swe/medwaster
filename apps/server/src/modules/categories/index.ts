import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia from "elysia";

export const categories = new Elysia({ prefix: "/categories" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      .get("/", ({ status }) => status(200, "All categories"))
      .get("/:id", ({ status, params: { id } }) =>
        status(200, `Category ${id}`),
      ),
  );

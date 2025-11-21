import { Elysia, t } from "elysia";
import { betterAuthMacro, ROLES } from "@/lib/auth";
import { ConfigService } from "./config.service";

export const adminConfig = new Elysia({ prefix: "/admin/config" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.SUPER_ADMIN] }, (app) =>
    app
      /**
       * GET /admin/config
       * Returns global configuration flags.
       */
      .get(
        "/",
        async () => {
          const config = await ConfigService.getConfig();
          return config;
        },
        {
          detail: {
            tags: ["Admin", "Config"],
            summary: "Get global configuration",
            description: "Returns global configuration flags.",
          },
        },
      )

      /**
       * PATCH /admin/config
       * Update global configuration flags.
       */
      .patch(
        "/",
        async ({ body }) => {
          const config = await ConfigService.updateConfig(body);
          return config;
        },
        {
          body: t.Object({
            autoApproveCertificates: t.Optional(t.Boolean()),
          }),
          detail: {
            tags: ["Admin", "Config"],
            summary: "Update global configuration",
            description: "Update global configuration flags.",
          },
        },
      ),
  );

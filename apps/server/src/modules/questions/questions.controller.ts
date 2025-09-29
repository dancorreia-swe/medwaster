import Elysia from "elysia";
import { z } from "zod";

import { listQuestions } from "./questions.service";
import { listQuerySchema, normalizeListParams } from "./questions.validators";
import { betterAuthMacro } from "@/lib/auth";

export const questionsController = new Elysia({
  prefix: "/admin/questions",
})
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
      beforeHandle(ctx) {
        const { set } = ctx;
        const authContext = (ctx as { auth?: { user?: { role?: string } } })
          .auth;
        const role = authContext?.user?.role;
        if (role !== "admin" && role !== "super_admin") {
          set.status = 403;
          return {
            error: "forbidden",
            message: "User does not have permission to access questions",
          };
        }
      },
    },
    (app) =>
      app.get("/", async ({ query, set }) => {
        try {
          const parsed = listQuerySchema.parse(query);
          const params = normalizeListParams(parsed);
          const result = await listQuestions(params);
          return result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            set.status = 400;
            return {
              error: "invalid_query",
              details: error.flatten(),
            };
          }

          if ((error as { status?: number }).status === 400) {
            set.status = 400;
            return {
              error: (error as { code?: string }).code ?? "bad_request",
              message: (error as Error).message,
            };
          }

          set.status = 500;
          return {
            error: "internal_server_error",
            message: "Unable to fetch questions",
          };
        }
      }),
  );

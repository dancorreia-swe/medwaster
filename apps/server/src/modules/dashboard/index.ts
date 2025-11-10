import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia from "elysia";
import { DashboardService } from "./dashboard.service";

export const dashboard = new Elysia({ prefix: "/dashboard" })
  .use(betterAuthMacro)
  .guard({ auth: true }, (app) =>
    app.get(
      "/stats",
      async ({ status }) => {
        const stats = await DashboardService.getDashboardStats();
        return status(200, stats);
      },
      {
        detail: {
          summary: "Get dashboard statistics",
          description:
            "Retrieve statistics for the dashboard including users, questions, quizzes, trails, categories, and wiki articles",
          tags: ["Dashboard"],
        },
      },
    ),
  );

import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia, { t } from "elysia";
import { createAchievementBody, updateAchievementBody } from "./model";
import { AchievementsService } from "./achievements.service";
import { NotFoundError } from "@/lib/errors";
import { success } from "@/lib/responses";

export const adminAchievements = new Elysia({
  prefix: "admin/achievements",
  tags: ["Admin - Achievements"],
  detail: {
    description:
      "Admin endpoints for managing achievements - full CRUD operations for gamification features",
  },
})
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
      role: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      detail: {
        description: "Admin or Super Admin access required",
      },
    },
    (app) =>
      app
        .get(
          "/",
          async ({ status, query }) => {
            const { page, pageSize } = query;
            const achievements = await AchievementsService.getAllAchievements({
              page,
              pageSize,
            });

            return status(200, achievements);
          },
          {
            query: t.Object({
              page: t.Optional(
                t.Number({
                  minimum: 1,
                  default: 1,
                  description: "Page number for pagination",
                }),
              ),
              pageSize: t.Optional(
                t.Number({
                  minimum: 1,
                  maximum: 100,
                  default: 50,
                  description: "Number of items per page",
                }),
              ),
            }),
            detail: {
              summary: "List all achievements",
              description:
                "Retrieve a paginated list of all achievements with their metadata including status, icon, and display order.",
              tags: ["Admin - Achievements"],
            },
          },
        )
        .get(
          "/:id",
          async ({ status, params: { id } }) => {
            const achievement = await AchievementsService.getAchievementById(
              id,
            );
            if (!achievement) {
              throw new NotFoundError("Achievement not found");
            }

            return status(200, achievement);
          },
          {
            params: t.Object({
              id: t.Number({ description: "Achievement ID" }),
            }),
            detail: {
              summary: "Get achievement by ID",
              description:
                "Retrieve a single achievement by its ID for viewing or editing. Includes all metadata and configuration.",
              tags: ["Admin - Achievements"],
            },
          },
        )
        .post(
          "/",
          async ({ body, status, user }) => {
            const achievement = await AchievementsService.createAchievement({
              ...body,
              createdBy: user!.id,
            });

            return status(201, achievement);
          },
          {
            body: createAchievementBody,
            detail: {
              summary: "Create new achievement",
              description:
                "Create a new achievement with title, description, icon, status, and display order. Can be marked as secret.",
              tags: ["Admin - Achievements"],
            },
          },
        )
        .patch(
          "/:id",
          async ({ params: { id }, body, status }) => {
            const achievement = await AchievementsService.updateAchievement(
              id,
              body,
            );

            return status(200, achievement);
          },
          {
            params: t.Object({
              id: t.Number({ description: "Achievement ID" }),
            }),
            body: updateAchievementBody,
            detail: {
              summary: "Update achievement",
              description:
                "Update an existing achievement. All fields are optional - only provided fields will be updated.",
              tags: ["Admin - Achievements"],
            },
          },
        )
        .delete(
          "/:id",
          async ({ status, params: { id } }) => {
            await AchievementsService.deleteAchievement(id);

            return status(200, success("Achievement deleted successfully"));
          },
          {
            params: t.Object({
              id: t.Number({ description: "Achievement ID" }),
            }),
            detail: {
              summary: "Delete achievement",
              description:
                "Permanently delete an achievement. This action cannot be undone.",
              tags: ["Admin - Achievements"],
            },
          },
        ),
  );

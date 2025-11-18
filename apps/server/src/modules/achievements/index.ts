import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia, { t } from "elysia";
import { createAchievementBody, updateAchievementBody } from "./model";
import { AchievementsService } from "./achievements.service";
import { NotFoundError } from "@/lib/errors";
import { success } from "@/lib/responses";
import { achievementImages } from "./images";
import { AchievementEngine } from "./engine";
import { AchievementNotificationService } from "./notification.service";

export const adminAchievements = new Elysia({
  prefix: "admin/achievements",
  tags: ["Admin - Achievements"],
  detail: {
    description:
      "Admin endpoints for managing achievements - full CRUD operations for gamification features",
  },
})
  .use(betterAuthMacro)
  .use(achievementImages)
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
            const achievement = await AchievementsService.createAchievement(
              body,
              user!.id,
            );

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
          async ({ params: { id }, body, status, user }) => {
            const achievement = await AchievementsService.updateAchievement(
              id,
              body,
              user!.id,
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

export const achievements = new Elysia({
  prefix: "achievements",
  tags: ["Achievements"],
  detail: {
    description:
      "Public endpoints for viewing achievements",
  },
})
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
      detail: {
        description: "Authentication required",
      },
    },
    (app) =>
      app
        .get(
          "/",
          async ({ status, user }) => {
            const allAchievements = await AchievementsService.getAllAchievements({
              page: 1,
              pageSize: 100,
            });

            // Filter to only show active achievements that are public
            const visibleAchievements = allAchievements.filter(
              (achievement) =>
                achievement.status === "active" &&
                achievement.visibility === "public",
            );

            // Get user's progress for all achievements
            const userProgress = await AchievementEngine.getUserAchievements(user!.id);
            const progressMap = new Map(
              userProgress.map((p) => [p.achievementId, p])
            );

            // Merge achievement definitions with user progress
            const achievementsWithProgress = visibleAchievements.map((achievement) => {
              const progress = progressMap.get(achievement.id);
              return {
                ...achievement,
                isUnlocked: progress?.isUnlocked || false,
                currentValue: progress?.currentValue || 0,
                targetValue: progress?.targetValue || 1,
                progressPercentage: progress?.progressPercentage || 0,
                unlockedAt: progress?.unlockedAt || null,
              };
            });

            return status(200, success(achievementsWithProgress));
          },
          {
            detail: {
              summary: "List all visible achievements",
              description:
                "Retrieve all active and public achievements with user progress",
              tags: ["Achievements"],
            },
          },
        )
        .get(
          "/my-progress",
          async ({ status, user }) => {
            const userAchievements = await AchievementEngine.getUserAchievements(user!.id);

            return status(200, success(userAchievements));
          },
          {
            detail: {
              summary: "Get my achievement progress",
              description:
                "Retrieve current user's progress on all achievements including locked and unlocked",
              tags: ["Achievements"],
            },
          },
        )
        .get(
          "/recent-unlocks",
          async ({ status, user, query }) => {
            const { limit = 5 } = query;
            const recentUnlocks = await AchievementEngine.getRecentlyUnlocked(
              user!.id,
              limit,
            );

            return status(200, success(recentUnlocks));
          },
          {
            query: t.Object({
              limit: t.Optional(
                t.Number({
                  minimum: 1,
                  maximum: 20,
                  default: 5,
                  description: "Number of recent unlocks to return",
                }),
              ),
            }),
            detail: {
              summary: "Get recently unlocked achievements",
              description:
                "Retrieve the most recently unlocked achievements for the current user",
              tags: ["Achievements"],
            },
          },
        )
        .get(
          "/unnotified",
          async ({ status, user }) => {
            const unnotified = await AchievementNotificationService.getUnnotifiedAchievements(
              user!.id
            );

            return status(200, success(unnotified));
          },
          {
            detail: {
              summary: "Get unnotified achievements",
              description:
                "Retrieve achievements that were unlocked but notification not yet shown to user",
              tags: ["Achievements"],
            },
          },
        )
        .post(
          "/mark-notified/:achievementId",
          async ({ status, user, params }) => {
            await AchievementNotificationService.markAsNotified(
              user!.id,
              params.achievementId
            );

            return status(200, success({ notified: true }));
          },
          {
            params: t.Object({
              achievementId: t.Number({ description: "Achievement ID" }),
            }),
            detail: {
              summary: "Mark achievement as notified",
              description:
                "Mark that the notification for this achievement was shown to the user",
              tags: ["Achievements"],
            },
          },
        )
        .get(
          "/notification-stats",
          async ({ status, user }) => {
            const stats = await AchievementNotificationService.getNotificationStats(
              user!.id
            );

            return status(200, success(stats));
          },
          {
            detail: {
              summary: "Get notification delivery stats",
              description:
                "Get statistics about achievement notification delivery for the current user",
              tags: ["Achievements"],
            },
          },
        ),
  );

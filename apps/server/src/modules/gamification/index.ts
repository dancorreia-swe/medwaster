import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia, { t } from "elysia";
import { StreaksService } from "./streaks.service";
import { DailyActivitiesService } from "./daily-activities.service";
import { MissionsService } from "./missions.service";
import { success } from "@/lib/responses";
import {
  createMissionBody,
  updateMissionBody,
  useFreezeBody,
  recordActivityBody,
} from "./model";

// ============================================================================
// User Gamification Endpoints
// ============================================================================

export const userGamification = new Elysia({
  prefix: "gamification",
  tags: ["Gamification"],
  detail: {
    description:
      "User endpoints for gamification features - streaks, missions, and daily activities",
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
        // Streak endpoints
        .get(
          "/streak",
          async ({ user, status }) => {
            const streak = await StreaksService.getUserStreak(user!.id);
            return status(200, {
              success: true,
              data: streak,
            });
          },
          {
            detail: {
              summary: "Get user's streak",
              description:
                "Retrieve current streak information including freeze count and next milestone",
              tags: ["Gamification"],
            },
          },
        )
        .post(
          "/streak/freeze",
          async ({ user, body }) => {
            const freezeDate = body.date ? new Date(body.date) : undefined;
            const streak = await StreaksService.useFreeze(user!.id, freezeDate);
            return success("Freeze used successfully", streak);
          },
          {
            body: useFreezeBody,
            detail: {
              summary: "Use a streak freeze",
              description:
                "Use one of your available freezes to protect your streak",
              tags: ["Gamification"],
            },
          },
        )
        .get(
          "/streak/milestones",
          async ({ user, status }) => {
            const milestones = await StreaksService.getUserMilestones(user!.id);
            return status(200, {
              success: true,
              data: milestones,
            });
          },
          {
            detail: {
              summary: "Get user's streak milestones",
              description: "Retrieve all achieved streak milestones",
              tags: ["Gamification"],
            },
          },
        )

        // Missions endpoints
        .get(
          "/missions",
          async ({ user, status }) => {
            console.log("🎯 [API /missions] Request from user:", user!.id);
            const missions = await MissionsService.getUserMissions(user!.id);
            console.log("🎯 [API /missions] Returning missions:", {
              daily: missions.daily.length,
              weekly: missions.weekly.length,
              monthly: missions.monthly.length,
            });
            return status(200, {
              success: true,
              data: missions,
            });
          },
          {
            detail: {
              summary: "Get user's active missions",
              description:
                "Retrieve all active missions categorized by frequency (daily, weekly, monthly)",
              tags: ["Gamification"],
            },
          },
        )

        // Daily activity endpoints
        .get(
          "/activity/today",
          async ({ user, status }) => {
            const activity = await DailyActivitiesService.getTodayActivity(
              user!.id,
            );
            return status(200, {
              success: true,
              data: activity,
            });
          },
          {
            detail: {
              summary: "Get today's activity",
              description: "Retrieve activity stats for today",
              tags: ["Gamification"],
            },
          },
        )
        .get(
          "/activity/weekly",
          async ({ user, status }) => {
            const stats = await DailyActivitiesService.getWeeklyStats(user!.id);
            return status(200, {
              success: true,
              data: stats,
            });
          },
          {
            detail: {
              summary: "Get weekly stats",
              description: "Retrieve aggregated activity stats for the last 7 days",
              tags: ["Gamification"],
            },
          },
        )
        .get(
          "/activity/history",
          async ({ user, query, status }) => {
            const history = await DailyActivitiesService.getActivityHistory(
              user!.id,
              query.days,
            );
            return status(200, {
              success: true,
              data: history,
            });
          },
          {
            query: t.Object({
              days: t.Optional(
                t.Number({
                  minimum: 1,
                  maximum: 365,
                  default: 30,
                  description: "Number of days to retrieve",
                }),
              ),
            }),
            detail: {
              summary: "Get activity history",
              description: "Retrieve daily activity history for the specified number of days",
              tags: ["Gamification"],
            },
          },
        )

        // Internal activity recording endpoint
        .post(
          "/activity/record",
          async ({ user, body }) => {
            const activity = await DailyActivitiesService.recordActivity(
              user!.id,
              body,
            );
            return success("Activity recorded successfully", activity);
          },
          {
            body: recordActivityBody,
            detail: {
              summary: "Record an activity",
              description:
                "Record a user activity (question, quiz, article, etc.) and update missions/streaks",
              tags: ["Gamification"],
            },
          },
        ),
  );

// ============================================================================
// Admin Missions Management Endpoints
// ============================================================================

export const adminGamification = new Elysia({
  prefix: "admin/gamification",
  tags: ["Admin - Gamification"],
  detail: {
    description:
      "Admin endpoints for managing gamification features - missions and milestones",
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
        // Mission CRUD
        .get(
          "/missions",
          async () => {
            const missions = await MissionsService.getAllMissions();
            return missions;
          },
          {
            detail: {
              summary: "List all missions",
              description: "Retrieve all missions (active, inactive, archived)",
              tags: ["Admin - Gamification"],
            },
          },
        )
        .get(
          "/missions/:id",
          async ({ params: { id } }) => {
            const mission = await MissionsService.getMissionById(id);
            return mission;
          },
          {
            params: t.Object({
              id: t.Number({ description: "Mission ID" }),
            }),
            detail: {
              summary: "Get mission by ID",
              description: "Retrieve a single mission by its ID",
              tags: ["Admin - Gamification"],
            },
          },
        )
        .post(
          "/missions",
          async ({ body }) => {
            const mission = await MissionsService.createMission(body);
            return mission;
          },
          {
            body: createMissionBody,
            detail: {
              summary: "Create new mission",
              description: "Create a new mission with specified parameters",
              tags: ["Admin - Gamification"],
            },
          },
        )
        .patch(
          "/missions/:id",
          async ({ params: { id }, body }) => {
            const mission = await MissionsService.updateMission(id, body as any);
            return mission;
          },
          {
            params: t.Object({
              id: t.Number({ description: "Mission ID" }),
            }),
            body: updateMissionBody,
            detail: {
              summary: "Update mission",
              description: "Update an existing mission",
              tags: ["Admin - Gamification"],
            },
          },
        )
        .delete(
          "/missions/:id",
          async ({ params: { id } }) => {
            await MissionsService.deleteMission(id);
            return success("Mission deleted successfully");
          },
          {
            params: t.Object({
              id: t.Number({ description: "Mission ID" }),
            }),
            detail: {
              summary: "Delete mission",
              description: "Permanently delete a mission",
              tags: ["Admin - Gamification"],
            },
          },
        )

        // Background job triggers (for manual testing)
        .post(
          "/assign-missions",
          async () => {
            await MissionsService.assignMissionsToAllUsers();
            return success("Missions assigned to all users");
          },
          {
            detail: {
              summary: "Assign missions to all users",
              description:
                "Manually trigger mission assignment (normally done by background worker)",
              tags: ["Admin - Gamification"],
            },
          },
        )
        .post(
          "/check-streaks",
          async () => {
            await StreaksService.checkAndBreakStreaks();
            return success("Streak check completed");
          },
          {
            detail: {
              summary: "Check and break streaks",
              description:
                "Manually trigger streak checking (normally done by background worker)",
              tags: ["Admin - Gamification"],
            },
          },
        ),
  );

export const gamification = new Elysia()
  .use(userGamification)
  .use(adminGamification);

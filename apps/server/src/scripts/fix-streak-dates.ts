import { db } from "@/db";
import { userStreaks, userDailyActivities } from "@/db/schema/gamification";
import { eq, desc } from "drizzle-orm";

/**
 * Fix streak dates to use proper UTC formatting
 */
async function fixStreakDates() {
  console.log("🔧 Starting streak date fix...");

  const allStreaks = await db.query.userStreaks.findMany();

  for (const streak of allStreaks) {
    console.log(`\n👤 Processing user: ${streak.userId}`);

    // Get user's activity history
    const activities = await db.query.userDailyActivities.findMany({
      where: eq(userDailyActivities.userId, streak.userId),
      orderBy: [desc(userDailyActivities.activityDate)],
    });

    if (activities.length === 0) {
      console.log("  ⚠️  No activities found, skipping");
      continue;
    }

    // Format date to UTC YYYY-MM-DD
    const formatDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Get the most recent activity date
    const lastActivityDate = formatDate(activities[0].activityDate);

    // Find streak start by going backwards through consecutive days
    let currentStreakStartDate = lastActivityDate;
    let consecutiveDays = 1;

    for (let i = 1; i < activities.length; i++) {
      const currentDate = new Date(formatDate(activities[i].activityDate));
      const prevDate = new Date(formatDate(activities[i - 1].activityDate));

      // Check if dates are consecutive (difference of 1 day)
      const diffTime = prevDate.getTime() - currentDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        consecutiveDays++;
        currentStreakStartDate = formatDate(activities[i].activityDate);
      } else {
        break; // Streak broken
      }
    }

    console.log(`  📊 Current streak: ${streak.currentStreak} days`);
    console.log(`  📊 Calculated streak: ${consecutiveDays} days`);
    console.log(`  📅 Last activity: ${lastActivityDate}`);
    console.log(`  📅 Streak start: ${currentStreakStartDate}`);

    // Update the streak with corrected UTC dates
    await db
      .update(userStreaks)
      .set({
        lastActivityDate,
        currentStreakStartDate,
        currentStreak: consecutiveDays,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, streak.userId));

    console.log("  ✅ Updated!");
  }

  console.log("\n✅ Streak date fix completed!");
}

fixStreakDates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

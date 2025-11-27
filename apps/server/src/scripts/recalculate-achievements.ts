import { db } from "../db";
import { AchievementEngine } from "../modules/achievements/engine";

async function recalculate() {
  const userId = "6GNf80UB2vhvr3Aq5HKmE0FAbgudlqwE";
  
  console.log(`🔄 Recalculating achievements for user ${userId}...\n`);
  
  // Get all achievement events for this user
  const events = await db.query.achievementEvents.findMany({
    where: (events, { eq }) => eq(events.userId, userId),
    orderBy: (events, { asc }) => [asc(events.createdAt)],
  });
  
  console.log(`Found ${events.length} events to reprocess`);
  
  // Reprocess each event
  for (const event of events) {
    console.log(`  Processing: ${event.eventType} from ${event.createdAt}`);
    try {
      await (AchievementEngine as any).processEvent(
        event.id,
        event.userId,
        event.eventType,
        event.eventData
      );
    } catch (error) {
      console.error(`    Error: ${error.message}`);
    }
  }
  
  console.log("\n✅ Done! Checking results...\n");
  
  // Check unlocked achievements
  const unlocked = await db.query.userAchievements.findMany({
    where: (ua, { and, eq }) => and(
      eq(ua.userId, userId),
      eq(ua.isUnlocked, true)
    ),
    with: {
      achievement: true,
    },
  });
  
  console.log(`Unlocked achievements: ${unlocked.length}`);
  unlocked.forEach(ua => {
    console.log(`  ✅ ${ua.achievement.name}`);
  });
  
  process.exit(0);
}

recalculate().catch(console.error);

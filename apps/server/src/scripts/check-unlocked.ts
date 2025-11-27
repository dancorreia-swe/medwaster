import { db } from "../db";
import { userAchievements, achievements } from "../db/schema/achievements";
import { eq, and } from "drizzle-orm";

async function checkUnlocked() {
  const userId = "6GNf80UB2vhvr3Aq5HKmE0FAbgudlqwE";
  
  console.log(`🔍 Checking unlocked achievements for user ${userId}...\n`);
  
  const unlocked = await db.query.userAchievements.findMany({
    where: and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.isUnlocked, true)
    ),
    with: {
      achievement: true,
    },
    orderBy: (ua, { desc }) => [desc(ua.unlockedAt)],
  });
  
  console.log(`Found ${unlocked.length} unlocked achievements:`);
  unlocked.forEach(ua => {
    console.log(`  ✅ ${ua.achievement.name} - unlocked at ${ua.unlockedAt} (notified: ${ua.notifiedAt ? 'yes' : 'NO'})`);
  });
  
  console.log(`\n🔍 Checking achievement progress...\n`);
  
  const allProgress = await db.query.userAchievements.findMany({
    where: eq(userAchievements.userId, userId),
    with: {
      achievement: true,
    },
    orderBy: (ua, { desc }) => [desc(ua.progressPercentage)],
    limit: 10,
  });
  
  console.log(`Top 10 achievements by progress:`);
  allProgress.forEach(ua => {
    console.log(`  ${ua.isUnlocked ? '✅' : '⏳'} ${ua.achievement.name}: ${ua.currentValue}/${ua.targetValue} (${ua.progressPercentage}%)`);
  });
  
  process.exit(0);
}

checkUnlocked().catch(console.error);

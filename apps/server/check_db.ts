import { db } from "./src/db";
import { achievementEvents, achievements } from "./src/db/schema/achievements";
import { eq } from "drizzle-orm";

async function checkDB() {
  console.log("🔍 Checking achievement events...");
  
  const events = await db.query.achievementEvents.findMany({
    orderBy: (events, { desc }) => [desc(events.createdAt)],
    limit: 5,
  });
  
  console.log(`Found ${events.length} recent events:`);
  events.forEach(e => {
    console.log(`  - ${e.eventType} for user ${e.userId} at ${e.createdAt} (processed: ${e.processed})`);
  });
  
  console.log("\n🏆 Checking achievements...");
  const achievementsList = await db.query.achievements.findMany({
    where: eq(achievements.status, "active"),
    limit: 5,
  });
  
  console.log(`Found ${achievementsList.length} active achievements:`);
  achievementsList.forEach(a => {
    console.log(`  - ${a.name} (${a.slug})`);
  });
  
  process.exit(0);
}

checkDB().catch(console.error);

import "dotenv/config";
import { MissionsService } from "@/modules/gamification/missions.service";

async function main() {
  // Get date from command line argument or use yesterday
  const dateArg = process.argv[2];
  const targetDate = dateArg ? new Date(dateArg) : getYesterday();

  console.log(`🎯 Assigning missions for date: ${targetDate.toISOString().split('T')[0]}...`);

  try {
    // Get all users
    const { db } = await import("@/db");
    const users = await db.query.user.findMany({
      columns: {
        id: true,
      },
    });

    console.log(`   Found ${users.length} users`);

    for (const user of users) {
      await MissionsService.assignMissionsToUser(user.id, targetDate);
    }

    console.log("✅ Missions assigned successfully!");
  } catch (error) {
    console.error("❌ Error assigning missions:", error);
    process.exit(1);
  }

  process.exit(0);
}

function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

main();

import "dotenv/config";
import { MissionsService } from "@/modules/gamification/missions.service";

async function main() {
  console.log("🎯 Assigning missions to all users...");

  try {
    await MissionsService.assignMissionsToAllUsers();
    console.log("✅ Missions assigned successfully!");
  } catch (error) {
    console.error("❌ Error assigning missions:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();

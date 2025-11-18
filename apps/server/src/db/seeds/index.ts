import { adminSeed } from "./user";
import { questionsSeed } from "./questions";
import { trailsSeed } from "./trails";
import { gamificationSeed } from "./gamification";
import { achievementsSeed } from "./achievements";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  await adminSeed();
  // await questionsSeed();
  await trailsSeed();
  await gamificationSeed();
  await achievementsSeed();

  console.log("\n🌿 Seeding completed successfully!");
  return process.exit(0);
}

main();

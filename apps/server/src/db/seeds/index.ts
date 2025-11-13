import { adminSeed } from "./user";
import { questionsSeed } from "./questions";
import { trailsSeed } from "./trails";
import { gamificationSeed } from "./gamification";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  await adminSeed();
  // await questionsSeed();
  await trailsSeed();
  await gamificationSeed();

  console.log("\n🌿 Seeding completed successfully!");
  return process.exit(0);
}

main();

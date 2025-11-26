import { adminSeed } from "./user";
import { questionsSeed } from "./questions";
import { trailsSeed } from "./trails";
import { gamificationSeed } from "./gamification";
import { achievementsSeed } from "./achievements";

async function main() {
  const isProduction = process.env.NODE_ENV === "production";
  console.log(
    `🌱 Starting database seeding (${isProduction ? "PRODUCTION" : "DEVELOPMENT"})...\n`,
  );

  // 1. System User & Configs (Core)
  await adminSeed();

  // 2. Gamification System (Core)
  await gamificationSeed();
  await achievementsSeed();

  // 3. Sample Content (Dev only)
  if (!isProduction) {
    console.log("\n📦 Seeding sample content (Dev only)...");
    await trailsSeed();
    // await questionsSeed(); // Optional extra questions
  } else {
    console.log("\n⏩ Skipping sample content (Production mode)");
  }

  console.log("\n🌿 Seeding completed successfully!");
  return process.exit(0);
}

main();

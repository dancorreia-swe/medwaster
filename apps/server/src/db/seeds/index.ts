import { adminSeed } from "./user";
import { questionsSeed } from "./questions";

async function main() {
  await adminSeed();
  // await questionsSeed();

  console.log("🌿 Seeding completed.");
  return process.exit(0);
}

main();

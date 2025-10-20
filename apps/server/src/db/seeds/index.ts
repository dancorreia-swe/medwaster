import { adminSeed } from "./user";

async function main() {
  await adminSeed();

  console.log("🌿 Seeding completed.");
  return process.exit(0);
}

main();

import { db } from "../db";
import { certificates } from "../db/schema/certificates";
import { trails, userTrailProgress } from "../db/schema/trails";
import { eq, and } from "drizzle-orm";

const userId = "KBukyNRNSCstIQDMiiUdQZ9ihjjR6HnH";

async function checkCertificates() {
  console.log("🔍 Checking certificate generation status...\n");

  // 1. Check total published trails
  const publishedTrails = await db.query.trails.findMany({
    where: eq(trails.status, "published"),
    columns: { id: true, name: true },
  });

  console.log("📚 Published Trails:", publishedTrails.length);
  publishedTrails.forEach((trail) => {
    console.log(`  - ${trail.id}: ${trail.name}`);
  });

  // 2. Check user's completed trails
  const completedTrails = await db.query.userTrailProgress.findMany({
    where: and(
      eq(userTrailProgress.userId, userId),
      eq(userTrailProgress.isCompleted, true),
      eq(userTrailProgress.isPassed, true),
    ),
    with: {
      trail: {
        columns: { id: true, name: true },
      },
    },
  });

  console.log(`\n✅ User Completed Trails: ${completedTrails.length}`);
  completedTrails.forEach((progress) => {
    console.log(`  - ${progress.trail.name} (Score: ${progress.bestScore})`);
  });

  // 3. Check if certificate exists
  const existingCert = await db.query.certificates.findFirst({
    where: eq(certificates.userId, userId),
  });

  console.log("\n📜 Certificate Status:");
  if (existingCert) {
    console.log(`  ✓ Certificate exists!`);
    console.log(`  - Status: ${existingCert.status}`);
    console.log(`  - Verification Code: ${existingCert.verificationCode}`);
    console.log(`  - Average Score: ${existingCert.averageScore}`);
    console.log(`  - Created At: ${existingCert.createdAt}`);
  } else {
    console.log(`  ✗ No certificate found`);
  }

  // 4. Check if user qualifies
  const qualifies = completedTrails.length >= publishedTrails.length;
  console.log(`\n🎯 Qualifies for Certificate: ${qualifies ? "YES ✓" : "NO ✗"}`);
  console.log(`   (${completedTrails.length}/${publishedTrails.length} trails completed)\n`);

  process.exit(0);
}

checkCertificates().catch(console.error);

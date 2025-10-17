import { sql } from "drizzle-orm";
import { db } from ".";

async function resetDatabase() {
  await db.execute(sql`drop schema if exists public cascade`);
  await db.execute(sql`drop schema if exists drizzle cascade`);
  await db.execute(sql`create schema if not exists public`);
  await db.execute(sql`create schema if not exists drizzle`);

  console.log("✅ Database reset complete.");
}

resetDatabase();

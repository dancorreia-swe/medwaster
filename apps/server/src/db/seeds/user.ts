import { auth } from "@/lib/auth";
import { db } from "..";
import { user } from "../schema/auth";
import { eq } from "drizzle-orm";

export function userSeed() {}

export async function adminSeed() {
  const email = process.env.ADMIN_EMAIL || "daniel@admin.com";
  const password = process.env.ADMIN_PASSWORD || "password";
  const name = process.env.ADMIN_NAME || "Daniel Correia";

  // In production, ensure we have strong credentials or skip/warn
  if (process.env.NODE_ENV === "production") {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn(
        "⚠️ Production environment detected but ADMIN_EMAIL or ADMIN_PASSWORD not set.",
      );
      console.warn("   Skipping admin user creation.");
      return;
    }
  }

  const adminUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!adminUser) {
    console.log(`  → Creating admin user: ${email}`);
    await auth.api.createUser({
      body: {
        email,
        password,
        name,
        role: "admin",
      },
    });
  } else {
    console.log(`  ✓ Admin user already exists: ${email}`);
  }
}

import { auth } from "@/lib/auth";
import { db } from "..";
import { user } from "../schema/auth";
import { eq } from "drizzle-orm";

export function userSeed() {}

export async function adminSeed() {
  const adminUser = await db.query.user.findFirst({
    where: eq(user.email, "daniel@admin.com"),
  });

  if (!adminUser) {
     await auth.api.createUser({
      body: {
        email: "daniel@admin.com",
        password: "password",
        name: "Daniel Correia",
        role: "admin",
      },
    });
  }
}

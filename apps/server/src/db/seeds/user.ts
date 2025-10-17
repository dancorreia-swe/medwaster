import { auth } from "@/lib/auth";

export function userSeed() {}

export async function adminSeed() {
  const admin = await auth.api.createUser({
    body: {
      email: "daniel@admin.com",
      password: "password",
      name: "Daniel Correia",
      role: "admin",
    },
  });
}

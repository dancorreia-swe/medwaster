import type { User } from "@/lib/auth-client";

export interface UserProfile extends User {
  role: UserRole;
}

export enum UserRole {
  SUPER_ADMIN = "super-admin",
  ADMIN = "admin",
}

export type AuthenticatedUser = UserProfile;

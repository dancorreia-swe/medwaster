import { describe, test, expect } from "vitest";
import { 
  hasMinimumRole, 
  hasRole, 
  canAccessAdminPanel, 
  canAccessSuperAdmin, 
  getRoleDisplayName,
  getAvailableRoles 
} from "../lib/rbac";
import type { User } from "../lib/auth-client";

const createMockUser = (role: string): User => ({
  id: "user123",
  name: "Test User", 
  email: "test@example.com",
  role,
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  banned: false,
});

describe("RBAC System", () => {
  describe("hasMinimumRole", () => {
    test("should allow admin to access admin resources", () => {
      expect(hasMinimumRole("admin", "admin")).toBe(true);
    });

    test("should allow super-admin to access admin resources", () => {
      expect(hasMinimumRole("super-admin", "admin")).toBe(true);
    });

    test("should deny user access to admin resources", () => {
      expect(hasMinimumRole("user", "admin")).toBe(false);
    });

    test("should deny null/undefined role", () => {
      expect(hasMinimumRole(null, "admin")).toBe(false);
      expect(hasMinimumRole(undefined, "admin")).toBe(false);
    });

    test("should deny invalid role", () => {
      expect(hasMinimumRole("invalid-role", "admin")).toBe(false);
    });
  });

  describe("hasRole", () => {
    test("should match exact roles", () => {
      expect(hasRole("admin", "admin")).toBe(true);
      expect(hasRole("user", "user")).toBe(true);
      expect(hasRole("super-admin", "super-admin")).toBe(true);
    });

    test("should deny different roles", () => {
      expect(hasRole("user", "admin")).toBe(false);
      expect(hasRole("admin", "super-admin")).toBe(false);
    });
  });

  describe("canAccessAdminPanel", () => {
    test("should allow admin users", () => {
      const adminUser = createMockUser("admin");
      expect(canAccessAdminPanel(adminUser)).toBe(true);
    });

    test("should allow super-admin users", () => {
      const superAdminUser = createMockUser("super-admin");
      expect(canAccessAdminPanel(superAdminUser)).toBe(true);
    });

    test("should deny regular users", () => {
      const regularUser = createMockUser("user");
      expect(canAccessAdminPanel(regularUser)).toBe(false);
    });

    test("should deny users without role", () => {
      const noRoleUser = createMockUser("");
      expect(canAccessAdminPanel(noRoleUser)).toBe(false);
    });

    test("should deny null user", () => {
      expect(canAccessAdminPanel(null)).toBe(false);
      expect(canAccessAdminPanel(undefined)).toBe(false);
    });
  });

  describe("canAccessSuperAdmin", () => {
    test("should allow only super-admin users", () => {
      const superAdminUser = createMockUser("super-admin");
      expect(canAccessSuperAdmin(superAdminUser)).toBe(true);
    });

    test("should deny admin users", () => {
      const adminUser = createMockUser("admin");
      expect(canAccessSuperAdmin(adminUser)).toBe(false);
    });

    test("should deny regular users", () => {
      const regularUser = createMockUser("user");
      expect(canAccessSuperAdmin(regularUser)).toBe(false);
    });
  });

  describe("getRoleDisplayName", () => {
    // "user" is a mobile-only role (see WEB_ROLE_HIERARCHY): the web app
    // labels it as such rather than as a plain user.
    test("should return proper Portuguese names", () => {
      expect(getRoleDisplayName("user")).toBe("Usuário (Mobile)");
      expect(getRoleDisplayName("admin")).toBe("Administrador");
      expect(getRoleDisplayName("super-admin")).toBe("Super Administrador");
    });

    test("should reject anything that is not a known role", () => {
      expect(getRoleDisplayName(null)).toBe("Acesso negado");
      expect(getRoleDisplayName(undefined)).toBe("Acesso negado");
      expect(getRoleDisplayName("invalid")).toBe("Acesso negado");
    });
  });

  describe("getAvailableRoles", () => {
    test("should return correct roles for super-admin", () => {
      const roles = getAvailableRoles("super-admin");
      expect(roles).toEqual(["user", "admin", "super-admin"]);
    });

    // Role management is a super-admin capability. An admin holds no
    // grantable roles at all, so the picker renders empty for them.
    test("should return nothing for admin", () => {
      expect(getAvailableRoles("admin")).toEqual([]);
    });

    test("should return nothing for a mobile user", () => {
      expect(getAvailableRoles("user")).toEqual([]);
    });

    test("should return empty array for invalid role", () => {
      const roles = getAvailableRoles("invalid");
      expect(roles).toEqual([]);
    });

    test("should return empty array for null/undefined", () => {
      expect(getAvailableRoles(null)).toEqual([]);
      expect(getAvailableRoles(undefined)).toEqual([]);
    });
  });

  describe("Role Hierarchy", () => {
    // The web hierarchy is admin < super-admin. "user" is deliberately not a
    // member (WEB_ROLE_HIERARCHY), so it is never a valid minimum to ask for
    // and is covered by the escalation test below instead.
    test("should maintain proper hierarchy order", () => {
      expect(hasMinimumRole("admin", "admin")).toBe(true);
      expect(hasMinimumRole("super-admin", "admin")).toBe(true);
      expect(hasMinimumRole("super-admin", "super-admin")).toBe(true);
    });

    test("should prevent privilege escalation", () => {
      // Users cannot access higher-level resources
      expect(hasMinimumRole("user", "admin")).toBe(false);
      expect(hasMinimumRole("user", "super-admin")).toBe(false);
      
      // Admins cannot access super-admin resources
      expect(hasMinimumRole("admin", "super-admin")).toBe(false);
    });
  });
});
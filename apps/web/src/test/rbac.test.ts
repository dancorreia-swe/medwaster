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
    test("should return proper Portuguese names", () => {
      expect(getRoleDisplayName("user")).toBe("Usuário");
      expect(getRoleDisplayName("admin")).toBe("Administrador");
      expect(getRoleDisplayName("super-admin")).toBe("Super Administrador");
      expect(getRoleDisplayName(null)).toBe("Sem permissão");
      expect(getRoleDisplayName(undefined)).toBe("Sem permissão");
      expect(getRoleDisplayName("invalid")).toBe("Sem permissão");
    });
  });

  describe("getAvailableRoles", () => {
    test("should return correct roles for super-admin", () => {
      const roles = getAvailableRoles("super-admin");
      expect(roles).toEqual(["user", "admin", "super-admin"]);
    });

    test("should return limited roles for admin", () => {
      const roles = getAvailableRoles("admin");
      expect(roles).toEqual(["user", "admin"]);
    });

    test("should return only user role for regular user", () => {
      const roles = getAvailableRoles("user");
      expect(roles).toEqual(["user"]);
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
    test("should maintain proper hierarchy order", () => {
      // User can access user-level resources
      expect(hasMinimumRole("user", "user")).toBe(true);
      
      // Admin can access user and admin resources
      expect(hasMinimumRole("admin", "user")).toBe(true);
      expect(hasMinimumRole("admin", "admin")).toBe(true);
      
      // Super-admin can access all resources
      expect(hasMinimumRole("super-admin", "user")).toBe(true);
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
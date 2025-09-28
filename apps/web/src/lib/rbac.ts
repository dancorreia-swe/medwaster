import type { User } from "./auth-client";

// Define allowed roles - USER ROLE IS FOR MOBILE APP ONLY
export type UserRole = "user" | "admin" | "super-admin";
export type WebAllowedRole = "admin" | "super-admin";

// Web-only role hierarchy (users cannot access web app)
const WEB_ROLE_HIERARCHY: WebAllowedRole[] = ["admin", "super-admin"];

/**
 * Check if user has minimum required role FOR WEB ACCESS
 * Note: "user" role cannot access web app at all
 */
export function hasMinimumRole(
  userRole: UserRole | string | null | undefined,
  minimumRole: WebAllowedRole,
): boolean {
  if (!userRole) return false;

  const userRoleIndex = WEB_ROLE_HIERARCHY.indexOf(userRole as WebAllowedRole);
  const minimumRoleIndex = WEB_ROLE_HIERARCHY.indexOf(minimumRole);

  return userRoleIndex !== -1 && userRoleIndex >= minimumRoleIndex;
}

/**
 * Check if user has exact role
 */
export function hasRole(
  userRole: string | null | undefined,
  requiredRole: UserRole,
): boolean {
  return userRole === requiredRole;
}

/**
 * Check if user can access the WEB APPLICATION AT ALL
 * Only admins and super-admins can access web interface
 */
export function canAccessWebApp(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return user.role === "admin" || user.role === "super-admin";
}

/**
 * Check if user can access admin panel (alias for canAccessWebApp)
 * Only admins and super-admins can access web interface
 */
export function canAccessAdminPanel(user: User | null | undefined): boolean {
  return canAccessWebApp(user);
}

/**
 * Check if user can access super admin features
 */
export function canAccessSuperAdmin(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return hasRole(user.role, "super-admin");
}

/**
 * Check if user can manage other users and admins
 */
export function canManageUsers(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return hasRole(user.role, "super-admin");
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return hasMinimumRole(user.role, "admin");
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string | null | undefined): string {
  switch (role) {
    case "super-admin":
      return "Super Administrador";
    case "admin":
      return "Administrador";
    case "user":
      return "Usuário (Mobile)";
    default:
      return "Acesso negado";
  }
}

/**
 * Get available roles for user management (Super admins can manage all roles)
 */
export function getAvailableRoles(
  currentUserRole: string | null | undefined,
): UserRole[] {
  if (currentUserRole === "super-admin") {
    // Super admins can manage all roles including mobile users
    return ["user", "admin", "super-admin"];
  }

  // Admins cannot manage roles (only super admins can)
  return [];
}

/**
 * Role-based error messages
 */
export const ROLE_ERRORS = {
  WEB_ACCESS_DENIED:
    "Usuários regulares devem usar o aplicativo móvel. O painel web é exclusivo para administradores.",
  ADMIN_REQUIRED: "Acesso restrito a administradores.",
  SUPER_ADMIN_REQUIRED: "Acesso restrito a super administradores.",
  INVALID_ROLE: "Função de usuário inválida.",
  USER_ROLE_WEB_BLOCKED:
    "Usuários com função 'user' devem usar o aplicativo móvel. Para acessar o painel web, entre em contato com um administrador.",
} as const;


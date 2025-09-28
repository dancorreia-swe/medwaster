import type { User } from "./auth-client";

export type UserRole = "user" | "admin" | "super-admin";

const ROLE_HIERARCHY: UserRole[] = ["user", "admin", "super-admin"];

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(
  userRole: string | null | undefined,
  minimumRole: UserRole,
): boolean {
  if (!userRole) return false;

  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole as UserRole);
  const minimumRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole);

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
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return hasMinimumRole(user.role, "admin");
}

/**
 * Check if user can access super admin features
 */
export function canAccessSuperAdmin(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return hasRole(user.role, "super-admin");
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return hasMinimumRole(user.role, "admin");
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
      return "Usuário";
    default:
      return "Sem permissão";
  }
}

/**
 * Get available roles for user management
 */
export function getAvailableRoles(
  currentUserRole: string | null | undefined,
): UserRole[] {
  if (!currentUserRole) return [];

  const currentIndex = ROLE_HIERARCHY.indexOf(currentUserRole as UserRole);
  if (currentIndex === -1) return [];

  // Users can assign roles up to their own level (but not higher)
  return ROLE_HIERARCHY.slice(0, currentIndex + 1);
}

/**
 * Role-based error messages
 */
export const ROLE_ERRORS = {
  INSUFFICIENT_PERMISSIONS:
    "Você não tem permissões suficientes para acessar este recurso.",
  ADMIN_REQUIRED: "Acesso restrito a administradores.",
  SUPER_ADMIN_REQUIRED: "Acesso restrito a super administradores.",
  INVALID_ROLE: "Função de usuário inválida.",
} as const;


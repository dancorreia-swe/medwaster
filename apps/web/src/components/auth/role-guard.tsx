import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import {
  canAccessSuperAdmin,
  hasMinimumRole,
  canAccessWebApp,
  type UserRole,
  type WebAllowedRole,
} from "@/lib/rbac";
import type { User } from "@/lib/auth-client";

interface RoleGuardProps {
  /** The minimum role required to view this content */
  minimumRole?: WebAllowedRole;
  /** Exact role required (use this OR minimumRole, not both) */
  exactRole?: UserRole;
  /** Custom role check function */
  customCheck?: (user: User | null) => boolean;
  /** Content to show when user has sufficient permissions */
  children: ReactNode;
  /** Content to show when user lacks permissions (optional) */
  fallback?: ReactNode;
  /** If true, will hide content instead of showing fallback */
  hideOnNoAccess?: boolean;
}

/**
 * Component that conditionally renders content based on user role
 */
export function RoleGuard({
  minimumRole,
  exactRole,
  customCheck,
  children,
  fallback,
  hideOnNoAccess = false,
}: RoleGuardProps) {
  const { data: session } = authClient.useSession();

  const hasAccess = () => {
    const user = session?.user;

    if (customCheck) {
      return customCheck(user || null);
    }

    if (exactRole) {
      return user?.role === exactRole;
    }

    if (minimumRole) {
      return hasMinimumRole(user?.role, minimumRole);
    }

    return true; // If no conditions specified, allow access
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (hideOnNoAccess) {
    return null;
  }

  return <>{fallback}</>;
}

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return {
    user,
    isLoggedIn: !!session,
    canAccessWebApp: canAccessWebApp(user),
    canAccessSuperAdmin: canAccessSuperAdmin(user),
    hasRole: (role: UserRole) => user?.role === role,
    hasMinimumRole: (role: WebAllowedRole) => hasMinimumRole(user?.role, role),
    role: user?.role as UserRole | null,
  };
}

/**
 * Pre-configured components for common role checks
 */
export const AdminOnly = ({
  children,
  fallback,
  hideOnNoAccess,
}: Omit<RoleGuardProps, "minimumRole">) => (
  <RoleGuard
    minimumRole="admin"
    fallback={fallback}
    hideOnNoAccess={hideOnNoAccess}
  >
    {children}
  </RoleGuard>
);

export const SuperAdminOnly = ({
  children,
  fallback,
  hideOnNoAccess,
}: Omit<RoleGuardProps, "exactRole">) => (
  <RoleGuard
    exactRole="super-admin"
    fallback={fallback}
    hideOnNoAccess={hideOnNoAccess}
  >
    {children}
  </RoleGuard>
);

export const UserOnly = ({
  children,
  fallback,
  hideOnNoAccess,
}: Omit<RoleGuardProps, "exactRole">) => (
  <RoleGuard
    exactRole="user"
    fallback={fallback}
    hideOnNoAccess={hideOnNoAccess}
  >
    {children}
  </RoleGuard>
);

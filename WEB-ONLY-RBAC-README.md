# 🛡️ Admin-Only Web App RBAC Implementation

## Overview

The MedWaster Learning platform implements a **strict platform separation** with comprehensive Role-Based Access Control (RBAC):

- **📱 Mobile App**: For regular users (`user` role) - learning content and questions
- **🌐 Web App**: Exclusively for administrators (`admin` + `super-admin` roles) - system management

## 🎭 Platform-Specific Role Access

### 🚫 **CRITICAL: Users with "user" role CANNOT access web app**

| User Role | Mobile App | Web App | Admin Panel | Super Admin Features |
|-----------|------------|---------|-------------|----------------------|
| `user` | ✅ **Primary Interface** | ❌ **Blocked** | ❌ No Access | ❌ No Access |
| `admin` | ❌ Not Needed | ✅ **Full Access** | ✅ Management | ❌ Limited |
| `super-admin` | ❌ Not Needed | ✅ **Full Access** | ✅ Management | ✅ **Full Control** |

## 🔐 Web App Access Control

### Root-Level Protection
```typescript
// _auth.tsx - Blocks ALL non-admin users from web app
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();

    // CRITICAL: Check web app access eligibility
    if (!canAccessWebApp(session.user)) {
      throw redirect({
        to: "/access-denied",
        search: {
          error: "web_access_denied",
          message: session.user.role === "user" 
            ? ROLE_ERRORS.USER_ROLE_WEB_BLOCKED
            : ROLE_ERRORS.WEB_ACCESS_DENIED,
        },
      });
    }
  },
});
```

### Access Denied Handling
Users attempting web access are redirected to a dedicated page that:
- Explains platform separation clearly
- Directs mobile users to download the app
- Provides contact information for admin access requests
- Shows current user role and permissions

## 🎯 Admin-Focused Web Features

### Admin Dashboard
```typescript
export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1>Painel Administrativo</h1>
      
      {/* Admin Statistics */}
      <AdminStats />
      
      {/* Admin Actions */}
      <AdminActions>
        <AuditLogsLink />          {/* All admins */}
        <UserManagement />         {/* Super admin only */}
        <SystemSettings />         {/* Super admin only */}
      </AdminActions>
    </div>
  );
}
```

### Role-Based Navigation
```typescript
// Sidebar shows admin-appropriate sections only
const adminItems = [
  { title: "Painel Principal", icon: Home },
  { title: "Logs de Auditoria", icon: Shield },
  { title: "Gerenciar Usuários", icon: Users, requiresSuperAdmin: true },
  { title: "Relatórios", icon: BarChart3 },
];
```

## 🛠️ RBAC Functions (Web-Focused)

### Core Access Control
```typescript
// Only admin roles can access web app
export function canAccessWebApp(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return user.role === "admin" || user.role === "super-admin";
}

// Super admin exclusive features
export function canAccessSuperAdmin(user: User | null | undefined): boolean {
  return user?.role === "super-admin";
}

// User management requires super admin
export function canManageUsers(user: User | null | undefined): boolean {
  return user?.role === "super-admin";
}
```

### Role Hierarchy (Web-Only)
```typescript
// Web app only recognizes admin roles
const WEB_ROLE_HIERARCHY: WebAllowedRole[] = ["admin", "super-admin"];

export function hasMinimumRole(
  userRole: string | null | undefined, 
  minimumRole: WebAllowedRole
): boolean {
  if (!userRole) return false;
  
  const userRoleIndex = WEB_ROLE_HIERARCHY.indexOf(userRole as WebAllowedRole);
  const minimumRoleIndex = WEB_ROLE_HIERARCHY.indexOf(minimumRole);
  
  return userRoleIndex !== -1 && userRoleIndex >= minimumRoleIndex;
}
```

## 🚨 Security Enforcement

### 1. **Multi-Layer Protection**
- **Route level**: Root `_auth` route blocks non-admins
- **Component level**: UI elements hide based on role
- **API level**: Server validates admin permissions
- **Navigation level**: Sidebar shows appropriate sections

### 2. **User Experience**
```typescript
// Clear messaging for blocked users
export const ROLE_ERRORS = {
  USER_ROLE_WEB_BLOCKED: 
    "Usuários com função 'user' devem usar o aplicativo móvel. Para acessar o painel web, entre em contato com um administrador.",
  WEB_ACCESS_DENIED: 
    "Usuários regulares devem usar o aplicativo móvel. O painel web é exclusivo para administradores.",
} as const;
```

### 3. **Audit Integration**
All blocked access attempts are logged:
```typescript
await AuditService.log({
  eventType: 'web_access_denied',
  userId: user.id,
  additionalContext: {
    userRole: user.role,
    attemptedUrl: location.pathname,
    reason: 'user_role_web_blocked'
  }
});
```

## 📱 Platform Separation Benefits

### For Users (`user` role):
- ✅ Optimized mobile learning experience  
- ✅ Touch-friendly question interface
- ✅ Offline content capabilities
- ✅ Push notifications for study reminders
- ❌ No confusion with admin features

### For Admins (`admin` + `super-admin`):
- ✅ Dedicated management interface
- ✅ Full-screen admin dashboards  
- ✅ Advanced data visualization
- ✅ Bulk operations and reporting
- ✅ System configuration tools

## 🧪 Testing Scenarios

### Test User Access Blocking
```typescript
// Test that users are blocked from web app
describe("Web App Access Control", () => {
  test("should block user role from web access", async () => {
    const userSession = { user: { role: "user" } };
    expect(canAccessWebApp(userSession.user)).toBe(false);
  });

  test("should allow admin access to web app", async () => {
    const adminSession = { user: { role: "admin" } };
    expect(canAccessWebApp(adminSession.user)).toBe(true);
  });
});
```

### Test Redirect Behavior
```typescript
// Test proper redirects to access denied page
test("should redirect users to access denied page", async () => {
  // Mock user trying to access web app
  // Verify redirect to /access-denied with appropriate message
});
```

## 🚀 Production Deployment

### Environment Setup
```env
# Web app configuration
ADMIN_WEB_ACCESS_ONLY=true
MOBILE_APP_DOWNLOAD_URL=https://apps.medwaster.com
USER_SUPPORT_EMAIL=admin@medwaster.com
```

### Security Checklist
- [ ] Verify all routes require admin role
- [ ] Test user role web access blocking
- [ ] Validate access denied page messaging
- [ ] Confirm audit logging of blocked attempts
- [ ] Test super admin feature restrictions
- [ ] Verify mobile app download links

---

## 🎯 **Key Achievement**

This implementation ensures that the **web application is exclusively for administrators**, while regular users are seamlessly directed to the mobile app. The platform separation provides:

- **Clear role boundaries**
- **Optimized experiences per platform**  
- **Enhanced security through role isolation**
- **Scalable admin management tools**

Users with `"user"` role have **zero access** to the web interface, ensuring complete platform separation as required.
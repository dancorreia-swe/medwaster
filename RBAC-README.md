# 🛡️ Role-Based Access Control (RBAC) Implementation

## Overview

The MedWaster Learning platform implements a comprehensive Role-Based Access Control (RBAC) system to ensure secure and appropriate access to different areas of the application based on user roles.

## 🎭 User Roles

### Role Hierarchy (ascending permissions):

1. **`user`** - Regular users
   - ✅ Access to learning content
   - ✅ View and answer questions
   - ✅ Personal profile management
   - ❌ No admin panel access

2. **`admin`** - Administrators  
   - ✅ All user permissions
   - ✅ Admin panel access
   - ✅ View audit logs
   - ✅ Manage users
   - ❌ No super admin features

3. **`super-admin`** - Super Administrators
   - ✅ All admin permissions
   - ✅ System configuration
   - ✅ Export audit logs
   - ✅ Full system control

## 🔐 Access Control Implementation

### Frontend Protection

#### Route-Level Guards
```typescript
// Admin routes are protected by parent route guard
export const Route = createFileRoute("/_auth/admin")({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    // Check admin permissions
    if (!canAccessAdminPanel(session.user)) {
      throw redirect({
        to: "/",
        search: {
          error: "insufficient_permissions",
          message: ROLE_ERRORS.ADMIN_REQUIRED,
        },
      });
    }
  },
});
```

#### Component-Level Guards
```typescript
import { AdminOnly, SuperAdminOnly } from "@/components/auth/role-guard";

// Hide admin features from regular users
<AdminOnly hideOnNoAccess>
  <AdminPanel />
</AdminOnly>

// Show super admin features only
<SuperAdminOnly>
  <SystemSettings />
</SuperAdminOnly>
```

#### Conditional Navigation
The sidebar dynamically shows/hides sections based on user role:

```typescript
// User Section - Always visible
<SidebarGroup>
  <SidebarGroupLabel>Medwaster</SidebarGroupLabel>
  {/* User navigation items */}
</SidebarGroup>

// Admin Section - Admin+ only
<AdminOnly hideOnNoAccess>
  <SidebarGroup>
    <SidebarGroupLabel>Administração</SidebarGroupLabel>
    {/* Admin navigation items */}
  </SidebarGroup>
</AdminOnly>

// Super Admin Section - Super Admin only
<SuperAdminOnly hideOnNoAccess>
  <SidebarGroup>
    <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
    {/* Super admin navigation items */}
  </SidebarGroup>
</SuperAdminOnly>
```

### Backend Protection

#### API Route Guards
```typescript
// Audit controller with role validation
export const auditController = new Elysia({ prefix: '/admin/audit-logs' })
  .derive(({ headers }) => {
    const userRole = headers['x-user-role'] || null;
    return { userRole };
  })
  .get('/', async ({ query, userRole, error }) => {
    if (!requireAdminRole(userRole)) {
      return error(403, {
        error: 'insufficient_permissions',
        message: 'Admin access required'
      });
    }
    // ... route logic
  })
```

## 🎯 Key Features

### 1. **Hierarchical Permissions**
- Higher roles inherit all permissions from lower roles
- Prevents privilege escalation attempts
- Clear separation of concerns

### 2. **Fail-Safe Design**
- Access denied by default for missing/invalid roles
- Graceful handling of permission errors
- User-friendly error messages in Portuguese

### 3. **Granular Control**
- Route-level protection
- Component-level visibility control
- API endpoint validation
- Database operation restrictions

### 4. **Audit Integration**
- All role-based access attempts are logged
- Permission violations trigger security events
- Comprehensive audit trail for compliance

## 🛠️ Utility Functions

### Core RBAC Functions
```typescript
// Check minimum role requirement
hasMinimumRole(userRole, "admin") // true for admin/super-admin

// Check exact role
hasRole(userRole, "super-admin") // true only for super-admin

// Specialized admin checks
canAccessAdminPanel(user) // admin or super-admin
canAccessSuperAdmin(user) // super-admin only
```

### React Hooks
```typescript
const { 
  user, 
  isLoggedIn, 
  canAccessAdmin, 
  canAccessSuperAdmin, 
  role 
} = usePermissions();
```

## 🚦 Route Structure

```
/                           # Dashboard (all authenticated users)
/_auth/                     # Protected area (authenticated users only)
├── admin/                  # Admin area (admin + super-admin only)
│   ├── audit-logs         # Audit logs (admin+)
│   ├── users              # User management (admin+)
│   └── system-settings    # System config (super-admin only)
└── profile                # User profile (all users)
```

## 🧪 Testing

### RBAC Test Coverage
```typescript
describe("RBAC System", () => {
  test("should allow admin to access admin resources", () => {
    expect(hasMinimumRole("admin", "admin")).toBe(true);
  });

  test("should deny user access to admin resources", () => {
    expect(hasMinimumRole("user", "admin")).toBe(false);
  });

  test("should maintain role hierarchy", () => {
    expect(hasMinimumRole("super-admin", "admin")).toBe(true);
    expect(hasMinimumRole("admin", "super-admin")).toBe(false);
  });
});
```

### Test Files
- `apps/web/src/test/rbac.test.ts` - Core RBAC functionality tests
- `apps/web/src/test/role-guard.test.tsx` - Component guard tests
- `apps/server/src/test/audit-controller.test.ts` - API protection tests

## 🔧 Configuration

### Environment Variables
```env
# Role validation settings (optional)
RBAC_STRICT_MODE=true
RBAC_AUDIT_FAILURES=true
RBAC_DEFAULT_ROLE=user
```

### Database Schema
The user role is stored in the `users.role` field:
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
```

## 📊 Security Features

### 1. **Access Denial Logging**
```typescript
await AuditService.log({
  eventType: 'unauthorized_access_attempt',
  userId: user.id,
  additionalContext: {
    attempted_resource: '/admin/audit-logs',
    user_role: user.role,
    required_role: 'admin'
  }
});
```

### 2. **Role Validation**
- Whitelist-based role validation
- Input sanitization for role fields
- Protection against role injection attacks

### 3. **Session Security**
- Role information stored in secure session
- Regular session validation
- Automatic logout on role changes

## 🎨 User Experience

### Permission Error Handling
- Graceful redirects with explanatory messages
- Context-aware error messages in Portuguese
- No broken layouts for insufficient permissions

### Visual Indicators
- Role badges in user interface
- Conditional navigation elements
- Clear permission hierarchy display

## 🚀 Production Deployment

### Security Checklist
- [ ] Verify all admin routes have proper guards
- [ ] Test role escalation prevention
- [ ] Validate audit logging for access attempts
- [ ] Confirm error message localization
- [ ] Test session invalidation on role changes

### Performance Considerations
- Role checks are cached in user session
- Minimal database queries for permission validation
- Efficient component rendering with hideOnNoAccess

---

This RBAC implementation ensures that users with "user" role cannot access any admin functionality, while providing a seamless and secure experience for administrators and super administrators.
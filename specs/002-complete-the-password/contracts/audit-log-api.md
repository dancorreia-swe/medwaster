# Audit Log API Contract

## Audit Log Viewing Endpoints

### List Audit Logs
**Purpose**: Retrieve paginated list of audit log entries with filtering
**Access**: Super Admin only

```http
GET /api/admin/audit-logs?page=1&limit=50&eventType=login_failure&userId=123&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <super_admin_jwt>
```

**Query Parameters**:
```typescript
interface AuditLogQueryParams {
  page?: number; // Default: 1
  limit?: number; // Default: 50, Max: 100
  eventType?: AuditEventType | AuditEventType[]; // Filter by event type(s)
  userId?: string; // Filter by specific user
  sessionId?: string; // Filter by session
  resourceType?: string; // Filter by resource type
  resourceId?: string; // Filter by specific resource
  ipAddress?: string; // Filter by IP address
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string; // Full-text search in context
}
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "id": "audit_01234567890",
      "eventType": "login_failure",
      "userId": "user_123",
      "sessionId": null,
      "timestamp": "2024-12-19T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "resourceType": "auth",
      "resourceId": "login_attempt",
      "oldValues": null,
      "newValues": null,
      "additionalContext": {
        "email": "user@example.com",
        "failureReason": "invalid_password",
        "attemptCount": 3
      },
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1247,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "eventType": "login_failure",
    "dateRange": {
      "start": "2024-12-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    }
  }
}
```

**Response Schema**:
```typescript
interface AuditLogListResponse {
  success: boolean;
  data: AuditLogEntry[];
  pagination: PaginationMeta;
  filters: AppliedFilters;
}

interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  userId: string | null;
  sessionId: string | null;
  timestamp: string; // ISO date
  ipAddress: string | null;
  userAgent: string | null;
  resourceType: string | null;
  resourceId: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  additionalContext: Record<string, any> | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
```

**Error Responses**:
```http
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

HTTP/1.1 403 Forbidden
{
  "success": false,
  "error": "Super Admin access required"
}

HTTP/1.1 400 Bad Request
{
  "success": false,
  "error": "Invalid date range or parameters"
}
```

---

### Get Audit Log Details
**Purpose**: Retrieve detailed information for a specific audit log entry
**Access**: Super Admin only

```http
GET /api/admin/audit-logs/{logId}
Authorization: Bearer <super_admin_jwt>
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "audit_01234567890",
    "eventType": "user_role_changed",
    "userId": "user_123",
    "sessionId": "session_456", 
    "timestamp": "2024-12-19T10:30:00Z",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "resourceType": "user",
    "resourceId": "user_789",
    "oldValues": {
      "role": "user"
    },
    "newValues": {
      "role": "admin"
    },
    "additionalContext": {
      "changedBy": "user_123",
      "reason": "Promotion to content manager",
      "previousRoleHistory": ["user"]
    },
    "checksum": "sha256:abc123...",
    "integrity": "valid",
    "user": {
      "id": "user_123",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "super-admin"
    },
    "session": {
      "id": "session_456",
      "createdAt": "2024-12-19T09:00:00Z",
      "expiresAt": "2024-12-20T09:00:00Z"
    },
    "targetUser": {
      "id": "user_789", 
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "admin"
    }
  }
}
```

---

### Export Audit Logs
**Purpose**: Export audit logs in various formats for external analysis
**Access**: Super Admin only

```http
POST /api/admin/audit-logs/export
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json

{
  "format": "csv",
  "filters": {
    "eventType": ["login_failure", "password_reset_requested"],
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "fields": ["timestamp", "eventType", "userId", "ipAddress", "additionalContext"]
}
```

**Request Schema**:
```typescript
interface ExportRequest {
  format: 'csv' | 'json' | 'xlsx';
  filters: AuditLogQueryParams;
  fields?: string[]; // Specific fields to include
  includeUserDetails?: boolean; // Default: false
  maxRecords?: number; // Default: 10000, Max: 50000
}
```

**Success Response**:
```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "success": true,
  "exportId": "export_12345",
  "message": "Export job queued. Download will be available shortly.",
  "estimatedCompletion": "2024-12-19T10:35:00Z"
}
```

**Download Ready**:
```http
GET /api/admin/audit-logs/export/{exportId}/download
Authorization: Bearer <super_admin_jwt>

HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="audit-logs-2024-12-19.csv"

[CSV content]
```

---

## Audit Log Statistics API

### Get Audit Statistics
**Purpose**: Retrieve summary statistics and metrics
**Access**: Super Admin only

```http
GET /api/admin/audit-logs/stats?period=30d
Authorization: Bearer <super_admin_jwt>
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "period": "30d",
    "totalEvents": 15420,
    "eventBreakdown": {
      "login_success": 8950,
      "login_failure": 342,
      "password_reset_requested": 89,
      "password_reset_completed": 67,
      "user_created": 23,
      "user_role_changed": 5
    },
    "topUsers": [
      {
        "userId": "user_123",
        "userName": "John Doe", 
        "eventCount": 456
      }
    ],
    "failureRates": {
      "login_failure_rate": 0.037, // 3.7%
      "password_reset_success_rate": 0.753 // 75.3%
    },
    "suspiciousActivity": [
      {
        "type": "repeated_failures",
        "ipAddress": "192.168.1.50",
        "count": 25,
        "lastOccurrence": "2024-12-19T09:45:00Z"
      }
    ],
    "storageInfo": {
      "totalRecords": 125430,
      "oldestRecord": "2024-01-01T00:00:00Z",
      "dataSize": "45.2 MB",
      "archivedRecords": 89234
    }
  }
}
```

---

## Internal Audit Logging Interface

### Audit Service Static Class
```typescript
// Following questions module pattern
export abstract class AuditService {
  static async log(entry: CreateAuditLogEntry, context?: RequestContext): Promise<string>;
  static async search(query: AuditSearchQuery): Promise<AuditSearchResult>;
  static async validateIntegrity(logId: string): Promise<boolean>;
  static async export(params: ExportParams): Promise<ExportResult>;
  static async getStatistics(period: string): Promise<AuditStatistics>;
}

interface CreateAuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  additionalContext?: Record<string, any>;
}

interface RequestContext {
  ipAddress: string;
  userAgent: string;
  timestamp?: Date;
}
```

### Audit Controller (Elysia Instance)
```typescript
// apps/server/src/modules/audit/audit.controller.ts
import { Elysia } from 'elysia';
import { AuditService } from './audit.service';
import { 
  auditListQuerySchema, 
  auditExportSchema,
  normalizeAuditListParams,
  normalizeExportParams 
} from './audit.validators';

export const auditController = new Elysia({ prefix: '/admin/audit-logs' })
  .guard({ auth: true }, (app) =>
    app
      .get('/', async ({ query, auth }) => {
        // Verify super admin role
        if (auth.user.role !== 'super-admin') {
          throw new Error('Super Admin access required');
        }
        
        const params = normalizeAuditListParams(query);
        return await AuditService.search(params);
      }, {
        query: auditListQuerySchema
      })
      
      .get('/:id', async ({ params, auth }) => {
        if (auth.user.role !== 'super-admin') {
          throw new Error('Super Admin access required');
        }
        
        return await AuditService.getById(params.id);
      })
      
      .post('/export', async ({ body, auth }) => {
        if (auth.user.role !== 'super-admin') {
          throw new Error('Super Admin access required');
        }
        
        const params = normalizeExportParams(body);
        return await AuditService.export(params);
      }, {
        body: auditExportSchema
      })
  );
```

### Middleware Integration
```typescript
// Elysia middleware for automatic audit logging
export const auditMiddleware = (options: AuditOptions = {}) => {
  return new Elysia({ name: 'audit-middleware' })
    .onBeforeHandle(async ({ request, store }) => {
      // Capture request context
      store.auditContext = {
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        timestamp: new Date()
      };
    })
    .onAfterHandle(async ({ response, store, auth, request }) => {
      // Log successful auth operations
      if (options.logSuccess && response.status < 400 && isAuthRoute(request.url)) {
        await AuditService.log({
          eventType: mapRouteToEventType(request.url),
          userId: auth?.user?.id,
          sessionId: auth?.session?.id
        }, store.auditContext);
      }
    })
    .onError(async ({ error, store, auth, request }) => {
      // Log auth failures
      if (isAuthRoute(request.url)) {
        await AuditService.log({
          eventType: 'AUTHENTICATION_ERROR',
          userId: auth?.user?.id,
          additionalContext: {
            error: error.message,
            route: request.url
          }
        }, store.auditContext);
      }
    });
};
```
```

## Event Type Definitions

```typescript
enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired',
  
  // Password Management
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_EMAIL_FAILED = 'password_reset_email_failed',
  
  // User Management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_BANNED = 'user_banned',
  USER_UNBANNED = 'user_unbanned',
  
  // Administrative Actions
  AUDIT_LOG_ACCESSED = 'audit_log_accessed',
  AUDIT_LOG_EXPORTED = 'audit_log_exported',
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  
  // Security Events
  SUSPICIOUS_ACTIVITY_DETECTED = 'suspicious_activity_detected',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt'
}
```

## Testing Contracts

### Unit Tests
```typescript
describe('Audit Log API', () => {
  test('should require super admin authentication');
  test('should filter logs by event type');
  test('should paginate large result sets');
  test('should export logs in requested format');
  test('should validate log integrity');
});
```

### Integration Tests
- Middleware audit capture
- Database integrity checks
- Export functionality
- Rate limiting on queries
- Cross-reference with actual events
# Research: Password Recovery and Audit Logging

**Phase 0 Research Findings**

## Email Service Integration

### Decision: Nodemailer with SMTP Transport
**Rationale**: 
- Battle-tested library with excellent TypeScript support
- Flexible SMTP configuration works with any provider (Gmail, SendGrid, Mailgun, etc.)
- Easy to mock for testing
- Integrates seamlessly with Better Auth's sendResetPassword callback
- Lower complexity than dedicated email service APIs

**Alternatives Considered**:
- SendGrid API: More complex setup, requires specific provider
- AWS SES: Excellent reliability but adds AWS dependency
- Resend: Modern API but newer ecosystem
- Direct SMTP: Lower-level, more configuration required

**Implementation Pattern**:
```typescript
// Better Auth integration
sendResetPassword: async ({ user, url, token }, request) => {
  await emailService.sendPasswordReset({
    to: user.email,
    name: user.name,
    resetUrl: url,
    token: token
  });
}
```

## Audit Logging Architecture

### Decision: Middleware-based Event Capture with Dedicated Schema
**Rationale**:
- Automatic capture reduces developer errors
- Centralized logging ensures consistency
- Dedicated schema optimizes for audit queries
- Middleware pattern integrates naturally with Elysia
- Immutable logs maintain integrity

**Alternatives Considered**:
- Application-level logging: Prone to inconsistency
- Database triggers: Limited context capture
- External logging service: Adds complexity and cost
- Event sourcing: Overkill for this use case

**Event Types to Track**:
```typescript
enum AuditEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure', 
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  USER_CREATED = 'user_created',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_BANNED = 'user_banned',
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired'
}
```

## Rate Limiting Strategy

### Decision: In-Memory Cache with Database Fallback
**Rationale**:
- Fast response times for legitimate users
- Persistent tracking across server restarts
- Simple implementation with existing database
- Configurable limits per endpoint

**Alternatives Considered**:
- Redis: Additional infrastructure dependency
- Database-only: Slower response times
- Memory-only: Lost on restart

**Rate Limit Rules**:
- Password reset: 5 requests per hour per user
- Failed logins: 10 attempts per hour per IP
- Audit log queries: 100 requests per minute per admin

## Security Considerations

### Password Reset Token Security
- Cryptographically secure random tokens (32 bytes, hex-encoded)
- 1-hour expiration window
- Single-use tokens (invalidated after use)
- IP address logging (not enforcement)
- No sensitive data in URLs

### Audit Log Protection
- Immutable log entries (no updates/deletes)
- Tamper-evident checksums
- Role-based access (Super Admin only)
- GDPR compliance: anonymization vs deletion
- 7-year retention with automatic archival

## Database Schema Extensions

### Password Reset Tokens
Extend existing `verification` table or create dedicated `password_reset_tokens`:
```sql
-- Option: Extend verification table (Better Auth pattern)
-- Uses existing verification table with type field

-- Option: Dedicated table (more explicit)
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP NULL,
  ip_address TEXT,
  user_agent TEXT
);
```

### Audit Logs
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT REFERENCES user(id),
  session_id TEXT REFERENCES session(id), 
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  additional_context JSONB,
  checksum TEXT NOT NULL -- tamper detection
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
```

## Performance Optimization

### Audit Log Queries
- Indexed by timestamp, user_id, event_type
- Pagination for large result sets
- Background archival process for old logs
- Materialized views for common queries

### Email Delivery
- Queue-based delivery for high volume
- Retry logic with exponential backoff  
- Dead letter queue for failed deliveries
- Monitoring and alerting

## Testing Strategy

### Email Testing
- Mock SMTP server for development
- Email template rendering tests
- Delivery failure simulation
- Rate limiting verification

### Audit Log Testing
- Middleware integration tests
- Log integrity verification
- GDPR compliance tests
- Query performance tests

## Development Environment Setup

### SMTP Configuration
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test@example.com
SMTP_PASS=testpass
SMTP_FROM=noreply@medwaster.com
SMTP_SECURE=false
```

### Development SMTP Server
Use Mailhog or similar for local email testing:
```bash
# Docker setup
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Or use built-in Node.js solution
npm install -g maildev
maildev --smtp 1025 --web 1080
```

## Next Steps for Phase 1

1. **Database Schema**: Create migration files for audit logs and password reset extensions
2. **API Contracts**: Define audit log viewing and filtering endpoints
3. **Email Templates**: Verify existing forget-password.tsx template meets requirements  
4. **Integration Points**: Document Better Auth configuration changes needed
5. **Admin Interface**: Design audit log viewer components and routes
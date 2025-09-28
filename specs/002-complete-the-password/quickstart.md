# Quickstart: Password Recovery and Audit Logging

## Development Environment Setup

### 1. Install Dependencies
```bash
cd apps/server
bun add nodemailer @types/nodemailer
bun add crypto-js @types/crypto-js
bun add date-fns
```

### 2. Environment Configuration
Add to `apps/server/.env`:
```env
# Email Service Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test@medwaster.local
SMTP_PASS=testpass
SMTP_FROM_NAME=MedWaster Learning
SMTP_FROM_ADDRESS=noreply@medwaster.com
SMTP_SECURE=false

# Audit Configuration
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years
AUDIT_CHECKSUM_SECRET=your-secret-key-here

# Rate Limiting
RATE_LIMIT_REDIS_URL=redis://localhost:6379  # Optional, falls back to memory
```

### 3. Development SMTP Server
Start a local mail server for testing:
```bash
# Option 1: Using Docker (recommended)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Option 2: Using npm
npm install -g maildev
maildev --smtp 1025 --web 8025
```

Access mail interface at http://localhost:8025

### 4. Database Migration
```bash
# Generate migration
bun run db:generate

# Apply migration
bun run db:push
```

## Quick Integration Test

### 1. Test Password Reset Flow
```bash
# Start the server
bun run dev:server

# Test password reset request (using Better Auth endpoint)
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "redirectTo": "http://localhost:3001/reset-password"
  }'

# Check MailHog at http://localhost:8025 for the email
# Click the link or extract token for next step

# Test password reset completion (using Better Auth endpoint)  
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "newPassword": "NewSecurePassword123!"
  }'
```

### 2. Test Audit Logging
```bash
# Create a test user and login to generate audit logs
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "name": "Test Admin"
  }'

# Login to create audit entry
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com", 
    "password": "SecurePass123!"
  }'

# Check audit logs (need super admin token)
curl -X GET "http://localhost:3000/api/admin/audit-logs" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

### 3. Test Rate Limiting Enhancement
```bash
# Test Better Auth's built-in rate limiting (should be rate limited)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/request-password-reset \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}'
  echo "Request $i"
done

# Check audit logs for rate limit monitoring
curl -X GET "http://localhost:3000/api/admin/audit-logs?eventType=password_reset_requested" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

## User Journey Examples

### Password Recovery Journey
1. **User forgets password** → Goes to login page, clicks "Forgot Password"
2. **User enters email** → System validates email, creates reset token
3. **System sends email** → Uses existing forget-password.tsx template
4. **User clicks email link** → Redirects to reset page with token
5. **User sets new password** → Token validated, password updated, sessions invalidated
6. **User logs in** → Can access account with new password

**Expected Audit Trail**:
- `PASSWORD_RESET_REQUESTED` (email sent)
- `PASSWORD_RESET_COMPLETED` (password changed)  
- `SESSION_CREATED` (new login)

### Admin Audit Review Journey
1. **Super Admin logs in** → Creates session audit entry
2. **Admin accesses audit logs** → `AUDIT_LOG_ACCESSED` event logged
3. **Admin filters by event type** → Views specific event types
4. **Admin exports logs** → `AUDIT_LOG_EXPORTED` event logged
5. **Admin reviews suspicious activity** → Identifies security concerns

## Testing Scenarios

### Email Delivery Tests
```typescript
// apps/server/src/lib/email-service.test.ts
import { EmailService } from './email-service';
import { mockSMTPServer } from '../test-utils/smtp-mock';

describe('EmailService', () => {
  it('should send password reset email', async () => {
    const emailService = new EmailService(testConfig);
    const result = await emailService.sendPasswordReset({
      to: 'test@example.com',
      userName: 'Test User',
      resetUrl: 'http://localhost:3000/reset?token=abc123',
      token: 'abc123'
    });

    expect(result.success).toBe(true);
    expect(mockSMTPServer.sentEmails).toHaveLength(1);
    expect(mockSMTPServer.sentEmails[0].to).toBe('test@example.com');
  });

  it('should handle SMTP failures gracefully', async () => {
    mockSMTPServer.shouldFail = true;
    // Test failure handling...
  });
});
```

### Audit Logging Tests
```typescript  
// apps/server/src/lib/audit-logger.test.ts
import { AuditLogger } from './audit-logger';

describe('AuditLogger', () => {
  it('should log authentication events', async () => {
    await auditLogger.log({
      eventType: 'LOGIN_SUCCESS',
      userId: 'user_123',
      additionalContext: { method: 'email' }
    });

    const logs = await auditLogger.search({ 
      eventType: 'LOGIN_SUCCESS',
      userId: 'user_123'
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].checksum).toBeDefined();
  });

  it('should prevent log tampering', async () => {
    const logId = await auditLogger.log({
      eventType: 'USER_CREATED',
      userId: 'user_456'
    });

    // Attempt to modify log directly in database
    await db.update(auditLog).set({ 
      eventType: 'USER_DELETED' 
    }).where(eq(auditLog.id, logId));

    const isValid = await auditLogger.validateIntegrity(logId);
    expect(isValid).toBe(false);
  });
});
```

### Rate Limiting Tests
```typescript
// apps/server/src/lib/rate-limiter.test.ts
describe('RateLimiter', () => {
  it('should limit password reset requests', async () => {
    const limiter = new RateLimiter({
      endpoint: 'password-reset',
      limit: 5,
      windowDuration: 3600 // 1 hour
    });

    // Make 5 requests (should succeed)
    for (let i = 0; i < 5; i++) {
      const allowed = await limiter.checkLimit('user_123');
      expect(allowed).toBe(true);
    }

    // 6th request should be blocked
    const blocked = await limiter.checkLimit('user_123');
    expect(blocked).toBe(false);
  });
});
```

## Troubleshooting Guide

### Email Delivery Issues
**Problem**: Password reset emails not sending
```bash
# Check SMTP configuration
curl -X GET http://localhost:3000/api/admin/email-service/status

# Check email service logs
grep "EMAIL_ERROR" logs/server.log

# Test SMTP connection
telnet localhost 1025
```

**Solutions**:
- Verify SMTP credentials in environment variables
- Check if SMTP server is running (MailHog/Maildev)
- Review firewall settings for SMTP port
- Check email service rate limits

### Audit Log Issues
**Problem**: Audit logs not appearing
```bash  
# Check audit middleware is registered
grep "audit" apps/server/src/index.ts

# Verify database connection
bun run db:studio

# Check audit log table structure
SELECT * FROM audit_log LIMIT 5;
```

**Solutions**:
- Ensure audit middleware is applied to routes
- Verify database schema migration completed
- Check for JavaScript errors in audit logger
- Confirm user permissions for audit access

### Rate Limiting Issues  
**Problem**: Users blocked unexpectedly
```bash
# Check rate limit trackers
SELECT * FROM rate_limit_tracker WHERE identifier = 'user_123';

# Reset rate limits for testing
DELETE FROM rate_limit_tracker WHERE endpoint = 'password-reset';
```

**Solutions**:
- Adjust rate limit thresholds in configuration
- Clear rate limit cache/database
- Check for clock synchronization issues
- Review rate limit window calculations

## Production Deployment Checklist

### Security Configuration
- [ ] Change default SMTP credentials
- [ ] Use secure SMTP connection (TLS/SSL)  
- [ ] Set strong `AUDIT_CHECKSUM_SECRET`
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS for reset links

### Email Service Setup
- [ ] Configure production SMTP provider (SendGrid, Mailgun, etc.)
- [ ] Set up SPF/DKIM records for email domain
- [ ] Configure bounce/complaint handling
- [ ] Set up email delivery monitoring

### Audit System Setup  
- [ ] Configure log retention policies
- [ ] Set up log archival storage
- [ ] Configure audit alert thresholds
- [ ] Set up backup procedures for audit logs

### Monitoring & Alerting
- [ ] Set up email delivery success rate monitoring
- [ ] Configure failed login attempt alerts
- [ ] Monitor audit log storage growth
- [ ] Set up rate limiting bypass for legitimate traffic

### Performance Optimization
- [ ] Configure database indexes for audit queries
- [ ] Set up Redis for rate limiting (optional)
- [ ] Configure email queue for high volume
- [ ] Optimize audit log queries with proper pagination

## Integration with Existing Features

### Better Auth Integration
The password recovery system extends the existing Better Auth configuration without breaking changes. The `sendResetPassword` callback integrates seamlessly with the current authentication flow.

### Database Schema Extensions
New tables (`audit_log`, `rate_limit_tracker`) complement existing auth tables. Password reset functionality can use the existing `verification` table or a dedicated table based on your preference.

### Admin Interface Integration
Audit log viewing integrates with the existing admin dashboard structure. Super Admin role checking uses the existing RBAC system.

### Mobile App Integration
Password reset flows work through email links that redirect to the web interface, maintaining consistency across platforms while leveraging the existing mobile authentication system.
# Better Auth Password Reset Integration

## Built-in Password Reset Endpoints

Better Auth provides these endpoints automatically when `emailAndPassword.enabled: true`:

### Request Password Reset (Built-in)
**Endpoint**: `POST /api/auth/request-password-reset`
**Purpose**: Request password reset email (Better Auth handles this automatically)

```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com",
  "redirectTo": "https://medwaster.com/reset-password"
}
```

**Success Response** (Better Auth provides):
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "If an account with this email exists, a password reset link has been sent."
}
```

### Reset Password with Token (Built-in) 
**Endpoint**: `POST /api/auth/reset-password`
**Purpose**: Complete password reset (Better Auth handles this automatically)

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "newPassword": "newSecurePassword123!",
  "token": "abc123...def789"
}
```

## Client-Side Integration

### Web Client Usage
```typescript
// apps/web/src/lib/auth-client.ts already configured
import { authClient } from '../lib/auth-client';

// Request password reset
const { error } = await authClient.requestPasswordReset({
  email: "user@example.com",
  redirectTo: "/reset-password"
});

// Reset password (on reset page)
const { data, error } = await authClient.resetPassword({
  newPassword: "newPassword123!",
  token: tokenFromURL
});
```

### Native Client Usage  
```typescript
// apps/native/lib/auth-client.ts already configured
import { authClient } from '../lib/auth-client';

// Same API as web client
const { error } = await authClient.requestPasswordReset({
  email: "user@example.com", 
  redirectTo: "medwaster://reset-password"
});
```

**Error Responses**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": "Invalid or expired token"
}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": "Password does not meet security requirements"
}
```

**Business Rules**:
1. Token must be valid and not expired (1 hour window)
2. Token can only be used once
3. New password must meet complexity requirements
4. All active sessions for user are invalidated
5. Audit log entry created for successful reset

---

## Email Service Internal Interface

### Email Service Configuration
```typescript
interface EmailServiceConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    address: string;
  };
  templates: {
    passwordReset: string; // Path to React Email template
  };
}
```

### Email Service Interface
```typescript
interface EmailService {
  sendPasswordReset(params: PasswordResetEmailParams): Promise<EmailResult>;
  validateConfiguration(): Promise<boolean>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}

interface PasswordResetEmailParams {
  to: string;
  userName: string;
  resetUrl: string;
  token: string;
  expiresAt: Date;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

enum DeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered', 
  FAILED = 'failed',
  BOUNCED = 'bounced'
}
```

### Better Auth Integration
```typescript
// Extension to existing auth.ts configuration
export const auth = betterAuth({
  // ... existing config ...
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      const emailService = new EmailService(emailConfig);
      
      const result = await emailService.sendPasswordReset({
        to: user.email,
        userName: user.name || user.email,
        resetUrl: url,
        token: token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });

      if (!result.success) {
        // Log error but don't throw (security by obscurity)
        await auditLogger.log({
          eventType: 'PASSWORD_RESET_EMAIL_FAILED',
          userId: user.id,
          additionalContext: { 
            error: result.error,
            email: user.email 
          }
        });
      }
    },
  },
});
```

## Error Handling

### Email Delivery Failures
```typescript
interface EmailError {
  type: 'smtp_error' | 'template_error' | 'validation_error' | 'rate_limit';
  message: string;
  code?: string;
  retryable: boolean;
}
```

**Error Types**:
- `smtp_error`: SMTP server issues (retryable)
- `template_error`: Email template rendering failure (not retryable)
- `validation_error`: Invalid email address (not retryable)
- `rate_limit`: Too many requests (retryable after delay)

### Retry Logic
```typescript
interface RetryConfig {
  maxAttempts: 3;
  backoffMultiplier: 2;
  initialDelay: 1000; // ms
  maxDelay: 30000; // ms
}
```

**Retry Strategy**:
1. Exponential backoff for transient failures
2. Dead letter queue for permanent failures
3. Circuit breaker for repeated SMTP failures
4. Admin alerts for high failure rates

## Testing Contracts

### Unit Test Scenarios
```typescript
describe('Password Reset Email', () => {
  test('should send email for valid user');
  test('should rate limit excessive requests');
  test('should handle SMTP failures gracefully');
  test('should not reveal user existence');
});

describe('Password Reset with Token', () => {
  test('should reset password with valid token');
  test('should reject expired tokens');
  test('should reject used tokens');
  test('should invalidate other sessions');
});
```

### Integration Test Scenarios
- SMTP server connectivity
- Email template rendering
- Rate limiting enforcement
- Audit log integration
- Better Auth callback execution

### Mock Interfaces
```typescript
interface MockEmailService extends EmailService {
  sentEmails: PasswordResetEmailParams[];
  shouldFail: boolean;
  deliveryDelay: number;
}
```
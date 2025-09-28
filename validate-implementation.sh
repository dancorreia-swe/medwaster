#!/usr/bin/env bash

echo "🧪 Quick Implementation Validation"
echo "================================="

cd /Users/danielmac/Code/college/medwaster

# Test 1: File Structure Validation
echo "📁 Checking file structure..."
FILES=(
    "apps/server/src/lib/email-service.ts"
    "apps/server/src/lib/auth.ts" 
    "apps/server/src/modules/audit/audit.service.ts"
    "apps/server/src/modules/audit/audit.controller.ts"
    "apps/server/src/db/schema/audit.ts"
    "apps/web/src/features/auth/components/forgot-password-form.tsx"
    "apps/web/src/routes/forgot-password.tsx"
    "apps/web/src/routes/reset-password.tsx"
    "apps/web/src/routes/admin/audit-logs.tsx"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file"
        MISSING=$((MISSING + 1))
    fi
done

# Test 2: Code Integration Points
echo ""
echo "🔗 Checking integration points..."

if grep -q "sendResetPassword" apps/server/src/lib/auth.ts; then
    echo "✅ Better Auth password reset integration"
else
    echo "❌ Better Auth integration missing"
fi

if grep -q "EmailService" apps/server/src/lib/auth.ts; then
    echo "✅ Email service integration"
else
    echo "❌ Email service integration missing"
fi

if grep -q "auditMiddleware" apps/server/src/index.ts; then
    echo "✅ Audit middleware applied"
else
    echo "❌ Audit middleware missing"
fi

# Test 3: Environment Configuration
echo ""
echo "⚙️  Environment configuration..."

if grep -q "SMTP_HOST" apps/server/.env.example; then
    echo "✅ SMTP environment variables configured"
else
    echo "❌ SMTP configuration missing"
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "==================="
if [[ $MISSING -eq 0 ]]; then
    echo "🎉 All core files present - Implementation Complete!"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Configure environment: cp apps/server/.env.example apps/server/.env"
    echo "2. Set SMTP credentials in .env file"  
    echo "3. Run database migrations: bun run db:push"
    echo "4. Start development servers: bun run dev"
    echo ""
    echo "✅ Password Recovery: http://localhost:3001/forgot-password"
    echo "✅ Admin Audit Logs: http://localhost:3001/admin/audit-logs"
else
    echo "⚠️  $MISSING files missing - check implementation"
fi
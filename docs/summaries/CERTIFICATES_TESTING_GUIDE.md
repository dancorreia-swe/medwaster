# Certificates Feature - Testing Guide

## 🎯 Overview

This guide will help you test the complete certificate approval workflow from backend to frontend.

---

## 📋 Prerequisites

### 1. **Database Setup**
Ensure you have the certificates table migrated:
```bash
cd apps/server
bun run db:migrate
```

### 2. **Server Running**
```bash
cd apps/server
bun run dev
# Server should be at http://localhost:3000
```

### 3. **Web App Running**
```bash
cd apps/web
bun run dev
# Web app should be at http://localhost:3001
```

### 4. **Admin User**
You need an admin user to access the certificates page. If you don't have one:
```sql
-- Connect to your database and run:
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 🧪 Testing Scenarios

### **Scenario 1: Generate a Certificate (Backend)**

Since certificates are auto-generated when a user completes ALL trails, we need to simulate this:

#### Option A: Via Database (Quick Test)
```sql
-- 1. Check how many published trails exist
SELECT COUNT(*) FROM trails WHERE status = 'published';

-- 2. Create or find a test user
SELECT id, name, email FROM "user" WHERE email = 'test@example.com';
-- If no user exists, create one via the app

-- 3. Mark ALL trails as completed for this user
-- First, get the user ID and trail IDs
SELECT id FROM trails WHERE status = 'published';

-- Then insert progress records (replace USER_ID and TRAIL_IDs)
INSERT INTO user_trail_progress (
  user_id, 
  trail_id, 
  is_enrolled, 
  is_completed, 
  is_passed, 
  best_score, 
  completed_at
)
SELECT 
  'USER_ID', 
  id, 
  true, 
  true, 
  true, 
  85.0,
  NOW()
FROM trails 
WHERE status = 'published'
ON CONFLICT (user_id, trail_id) 
DO UPDATE SET 
  is_completed = true,
  is_passed = true,
  best_score = 85.0,
  completed_at = NOW();

-- 4. Trigger certificate generation via API
-- Complete one more content item to trigger the check
-- OR manually call the service
```

#### Option B: Via Backend API (Realistic)
```bash
# Use a REST client (Postman, Insomnia, or curl)

# 1. Login as a student
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password"
  }'
# Save the session cookie

# 2. Enroll in all trails
curl http://localhost:3000/trails \
  -H "Cookie: your-session-cookie"
# Get all trail IDs

curl -X POST http://localhost:3000/trails/:trailId/enroll \
  -H "Cookie: your-session-cookie"
# Repeat for each trail

# 3. Complete all trails
# You would need to complete all questions/quizzes in each trail
# This is time-consuming, so use database method for testing
```

#### Option C: Direct Service Call (For Development)
```typescript
// In apps/server, create a test script:
// test-certificate.ts

import { CertificateService } from "./src/modules/certificates/certificates.service";

async function testCertificate() {
  const userId = "your-test-user-id";
  
  try {
    const certificate = await CertificateService.generateCertificate(userId);
    console.log("Certificate generated:", certificate);
  } catch (error) {
    console.error("Error:", error);
  }
}

testCertificate();
```

```bash
bun run test-certificate.ts
```

---

### **Scenario 2: View Pending Certificates (Frontend)**

#### Steps:
1. **Login as Admin**
   - Navigate to `http://localhost:3001`
   - Login with admin credentials
   
2. **Navigate to Certificates**
   - Click on "Certificados" in sidebar (if available)
   - OR directly visit `http://localhost:3001/certificates`

3. **Expected View**:
   ```
   ┌─────────────────────────────────────────┐
   │ Certificados                            │
   │ Gerencie e aprove os certificados...    │
   └─────────────────────────────────────────┘
   
   ┌──────────┬──────────┬──────────┬────────┐
   │ Total: 1 │ Pend.: 1 │ Aprov.: 0│ Rej.: 0│
   └──────────┴──────────┴──────────┴────────┘
   
   Table with pending certificate(s)
   ```

4. **What to Check**:
   - ✅ Stats cards display correctly
   - ✅ Table shows pending certificate
   - ✅ User name, email, score, trails count are correct
   - ✅ Status badge shows "Pendente" (yellow)
   - ✅ Completion date is formatted correctly

---

### **Scenario 3: Review Certificate Details**

#### Steps:
1. **Click on a certificate row** in the table
2. **Review modal should open** with:
   - User avatar and info
   - 4 stat cards (Score, Trails, Time, Date)
   - Verification code
   - Aprovar/Rejeitar buttons

3. **What to Check**:
   - ✅ Modal opens smoothly
   - ✅ User information is correct
   - ✅ Statistics match database values
   - ✅ Verification code format: `CERT-YYYY-XXXXXXXX`
   - ✅ Buttons are enabled

---

### **Scenario 4: Approve Certificate**

#### Steps:
1. **Click "Aprovar"** button
2. **Optional**: Add notes in textarea
3. **Click "Confirmar Aprovação"**
4. **Expected**:
   - Success toast: "Certificado aprovado com sucesso!"
   - Modal closes
   - Certificate disappears from pending list
   - Stats update: Pending -1, Approved +1

5. **Verify in Database**:
   ```sql
   SELECT 
     id,
     status,
     reviewed_by,
     reviewed_at,
     issued_at,
     review_notes
   FROM certificates 
   WHERE id = YOUR_CERT_ID;
   ```
   
   Should show:
   - `status = 'approved'`
   - `reviewed_by = admin-user-id`
   - `reviewed_at = NOW()`
   - `issued_at = NOW()`
   - `review_notes = your notes (if added)`

6. **Verify via API**:
   ```bash
   curl http://localhost:3000/admin/certificates/stats
   
   # Should return updated stats:
   {
     "total": 1,
     "pending": 0,
     "approved": 1,
     "rejected": 0,
     "revoked": 0,
     "approvalRate": 100
   }
   ```

---

### **Scenario 5: Reject Certificate**

#### Steps:
1. Generate another certificate (follow Scenario 1)
2. **Click "Rejeitar"** button in modal
3. **Add rejection reason** (required!)
   - Example: "Pontuação muito baixa para certificação"
4. **Click "Confirmar Rejeição"**
5. **Expected**:
   - Success toast: "Certificado rejeitado"
   - Modal closes
   - Certificate disappears from pending
   - Stats update: Pending -1, Rejected +1

6. **Verify in Database**:
   ```sql
   SELECT status, review_notes FROM certificates WHERE id = YOUR_CERT_ID;
   ```
   
   Should show:
   - `status = 'rejected'`
   - `review_notes = your reason`

---

### **Scenario 6: Verify Certificate (Public Endpoint)**

#### Steps:
1. **Get verification code** from approved certificate
2. **Call public verification endpoint**:
   ```bash
   curl http://localhost:3000/certificates/verify/CERT-2025-XXXXXXXX
   ```

3. **Expected Response** (if approved):
   ```json
   {
     "isValid": true,
     "userName": "John Doe",
     "issuedAt": "2025-11-13T...",
     "averageScore": 87.5,
     "totalTrailsCompleted": 12
   }
   ```

4. **Expected Response** (if pending/rejected):
   ```json
   {
     "isValid": false,
     "message": "Certificate not found or not approved"
   }
   ```

---

### **Scenario 7: Edge Cases**

#### Test 1: Empty State
1. Delete or approve all pending certificates
2. Visit `/certificates`
3. **Expected**: 
   - Stats show 0 pending
   - Table shows empty state with message
   - "Nenhum certificado encontrado"

#### Test 2: Error Handling
1. Stop the backend server
2. Try to approve a certificate
3. **Expected**:
   - Error toast with message
   - Modal stays open
   - Button re-enables

#### Test 3: Validation
1. Try to reject without providing reason
2. **Expected**:
   - Button stays disabled
   - Error message below textarea
   - "O motivo da rejeição é obrigatório"

#### Test 4: Loading States
1. Open review modal
2. Click approve/reject
3. **Expected**:
   - Button shows loading spinner
   - "Processando..." text
   - Button disabled during request

---

## 🔍 Manual Testing Checklist

### Frontend UI:
- [ ] Stats cards load correctly
- [ ] Table displays pending certificates
- [ ] Empty state shows when no certificates
- [ ] Loading skeletons appear while fetching
- [ ] Click row opens modal
- [ ] Dropdown actions work
- [ ] Modal shows all certificate data
- [ ] Approve flow works
- [ ] Reject flow works (with required reason)
- [ ] Toast notifications appear
- [ ] Query cache invalidates (list updates)
- [ ] Error alerts display on API errors

### Backend API:
- [ ] GET /admin/certificates/pending returns data
- [ ] GET /admin/certificates/stats returns stats
- [ ] POST /admin/certificates/:id/approve works
- [ ] POST /admin/certificates/:id/reject works
- [ ] GET /certificates/verify/:code works (public)
- [ ] Auth checks work (403 for non-admin)
- [ ] Validation works (reject requires reason)
- [ ] Database updates correctly

### Integration:
- [ ] Certificate auto-generates on trail completion
- [ ] Only generates when ALL trails completed
- [ ] One certificate per user
- [ ] Stats update in real-time
- [ ] Verification code is unique
- [ ] Timestamps are correct

---

## 🐛 Common Issues & Solutions

### Issue: No certificates showing
**Solution**: 
```sql
-- Check if any exist
SELECT * FROM certificates;

-- Generate one manually
-- Follow Scenario 1, Option A
```

### Issue: "Admin access required" error
**Solution**:
```sql
-- Make yourself admin
UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
```

### Issue: Route not found (404)
**Solution**:
```bash
# Regenerate route tree
cd apps/web
bun run dev
# Should auto-generate routeTree.gen.ts
```

### Issue: TypeScript errors in web app
**Solution**:
```bash
# Check client types are generated
cd apps/web
# The Eden Treaty client should have admin.certificates types
# If not, restart the server to regenerate types
```

---

## 📊 Database Queries for Testing

### View all certificates:
```sql
SELECT 
  c.id,
  c.status,
  c.average_score,
  c.verification_code,
  u.name as user_name,
  u.email as user_email,
  c.created_at
FROM certificates c
JOIN "user" u ON c.user_id = u.id
ORDER BY c.created_at DESC;
```

### Check trail completion for user:
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'published') as total_trails,
  COUNT(*) FILTER (WHERE utp.is_completed = true AND utp.is_passed = true) as completed_trails
FROM trails t
LEFT JOIN user_trail_progress utp ON t.id = utp.trail_id AND utp.user_id = 'USER_ID';
```

### Reset certificate for testing:
```sql
DELETE FROM certificates WHERE user_id = 'USER_ID';
```

---

## 🚀 Quick Test Script

Here's a complete test script you can run:

```bash
#!/bin/bash

echo "🧪 Testing Certificates Feature"

# 1. Check server
echo "1. Checking server..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Server running" || echo "❌ Server not running"

# 2. Check web app
echo "2. Checking web app..."
curl -s http://localhost:3001 > /dev/null && echo "✅ Web app running" || echo "❌ Web app not running"

# 3. Test stats endpoint
echo "3. Testing stats endpoint..."
curl -s http://localhost:3000/admin/certificates/stats | jq '.' || echo "❌ Stats endpoint failed"

# 4. Test pending endpoint
echo "4. Testing pending endpoint..."
curl -s http://localhost:3000/admin/certificates/pending | jq '.' || echo "❌ Pending endpoint failed"

echo ""
echo "✅ Basic connectivity tests complete!"
echo "Now manually test the UI at http://localhost:3001/certificates"
```

Save as `test-certificates.sh`, make executable, and run:
```bash
chmod +x test-certificates.sh
./test-certificates.sh
```

---

## 📝 Notes

- **Auto-generation** happens only when user completes the LAST trail
- **One certificate per user** - attempting to generate again returns existing
- **Public verification** only works for approved certificates
- **Revoke functionality** exists in backend but not in frontend yet

---

**Ready to test!** Start with Scenario 1 to generate a certificate, then proceed through the scenarios. 🎉

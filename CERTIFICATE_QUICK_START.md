# Certificate Approval System - Quick Start Guide

## 🎯 Quick Overview

**What it does**: Automatically generates a certificate when a user completes **ALL trails**, then waits for manual stakeholder approval before the user can download it.

**Status**: Backend ✅ Complete | Frontend 🔴 TODO

---

## 🚀 Try It Now (Backend)

### 1. **Test Certificate Generation**

```bash
# Using curl or Postman:

# 1. Login as a student
POST http://localhost:3000/api/auth/sign-in/email
{
  "email": "student@example.com",
  "password": "password"
}

# 2. Complete all trails (simulate by updating DB directly)
# Connect to your database and run:
UPDATE user_trail_progress 
SET is_completed = true, 
    is_passed = true, 
    best_score = 85,
    completed_at = NOW()
WHERE user_id = 'your-user-id';

# 3. Trigger the last trail completion via API
# This will auto-generate the certificate
POST http://localhost:3000/trails/{trailId}/questions/{questionId}/submit
# (Complete the last question correctly)

# 4. Check if certificate was generated
GET http://localhost:3000/certificates
# Should return: { certificate: { status: "pending", ... } }
```

---

### 2. **Test Admin Approval**

```bash
# 1. Login as admin
POST http://localhost:3000/api/auth/sign-in/email
{
  "email": "admin@example.com",
  "password": "admin-password"
}

# 2. Get pending certificates
GET http://localhost:3000/admin/certificates/pending
# Response: { certificates: [...], total: 1 }

# 3. Approve the certificate
POST http://localhost:3000/admin/certificates/1/approve
{
  "notes": "Parabéns pelo excelente desempenho!"
}

# 4. Verify it was approved
GET http://localhost:3000/certificates
# Response: { certificate: { status: "approved", issuedAt: "...", ... } }
```

---

### 3. **Test Public Verification**

```bash
# Get verification code from previous response, then:
GET http://localhost:3000/certificates/verify/CERT-2025-XXXXXXXX

# Response (if approved):
{
  "isValid": true,
  "userName": "John Doe",
  "issuedAt": "2025-11-13T...",
  "averageScore": 87.5,
  "totalTrailsCompleted": 12
}
```

---

## 📁 Files Created

### Backend:
```
apps/server/src/
├── db/
│   ├── schema/certificates.ts              ✅ NEW
│   └── migrations/0006_*.sql               ✅ NEW
└── modules/
    └── certificates/
        ├── certificates.service.ts         ✅ NEW
        └── index.ts                        ✅ NEW
```

### Frontend (TODO):
```
apps/native/
└── app/(app)/(tabs)/(profile)/
    └── certificates.tsx                    🔴 UPDATE NEEDED

apps/web/src/
└── features/certificates/                  🔴 NEW FEATURE
    ├── components/
    │   ├── certificate-pending-list.tsx
    │   ├── certificate-review-modal.tsx
    │   └── certificate-stats.tsx
    └── api.ts
```

---

## 🔑 Key Concepts

### Certificate States:
1. **pending** - Just generated, waiting for admin review
2. **approved** - Admin approved, user can download PDF
3. **rejected** - Admin rejected with reason
4. **revoked** - Previously approved but revoked

### Automatic Generation:
- Happens when user **passes** the **last trail**
- Requires ALL published trails to be completed
- Only generates once per user (checked by userId)

### Verification Code:
- Format: `CERT-2025-A1B2C3D4`
- Unique per certificate
- Used for public verification (QR codes, etc.)

---

## 🎨 Frontend Implementation Priority

### Phase 1: Student View (2-3 hours)
- [ ] Update `apps/native/app/(app)/(tabs)/(profile)/certificates.tsx`
- [ ] Show certificate status with badge
- [ ] Display verification code
- [ ] Show approval/rejection message
- [ ] Add download button (when PDF ready)

### Phase 2: Admin Dashboard (4-5 hours)
- [ ] Create pending certificates list page
- [ ] Build review modal with approve/reject actions
- [ ] Add statistics dashboard
- [ ] Implement notifications for new pending certs

### Phase 3: PDF Generation (3-4 hours)
- [ ] Choose PDF library (@react-pdf/renderer recommended)
- [ ] Design certificate template
- [ ] Generate PDF on approval
- [ ] Upload to CDN/S3
- [ ] Add download endpoint

---

## 📊 Database Quick Check

```sql
-- Check if certificate table exists
SELECT * FROM pg_tables WHERE tablename = 'certificates';

-- Check certificate status enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'certificate_status'::regtype;

-- View all certificates
SELECT 
  c.id,
  c.status,
  u.name as user_name,
  c.average_score,
  c.verification_code,
  c.created_at
FROM certificates c
JOIN "user" u ON c.user_id = u.id
ORDER BY c.created_at DESC;
```

---

## 🐛 Troubleshooting

### Certificate not generating?
```sql
-- Check if user completed ALL trails
SELECT 
  (SELECT COUNT(*) FROM trails WHERE status = 'published') as total_trails,
  (SELECT COUNT(*) FROM user_trail_progress 
   WHERE user_id = 'XXX' 
     AND is_completed = true 
     AND is_passed = true) as completed_trails;
```

### API returns error?
- Check server logs for detailed error
- Verify user authentication
- Ensure trails are marked as 'published'

---

## 📚 Next Steps

1. **Read**: `CERTIFICATE_APPROVAL_IMPLEMENTATION.md` for full details
2. **Implement**: Student UI first (immediate user value)
3. **Build**: Admin dashboard second
4. **Add**: PDF generation last

---

## 💡 Tips

- Use `GET /admin/certificates/stats` for dashboard metrics
- Verification endpoint is public (no auth required)
- Rejection requires a reason, approval doesn't
- Certificate URL is null until PDF is generated

**Happy coding! 🚀**

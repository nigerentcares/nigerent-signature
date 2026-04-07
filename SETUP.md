# Nigerent Signature Lifestyle — Setup Guide

## Layer 1: Project Foundation

### Step 1 — Install dependencies
```bash
cd nigerent-signature
npm install
```

### Step 2 — Configure environment
```bash
cp .env.local .env.local
# Open .env.local and fill in all values:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - DATABASE_URL  (Supabase Postgres, transaction mode, port 6543)
# - DIRECT_URL    (Supabase Postgres, direct, port 5432)
# - PAYSTACK keys (for Layer 4)
# - RESEND_API_KEY (for Layer 10)
```

### Step 3 — Run Prisma migration
```bash
npm run db:generate
npm run db:migrate
# Name your migration: init
```

### Step 4 — Apply Supabase RLS policies
Open Supabase dashboard → SQL Editor → paste contents of `prisma/rls.sql` → Run.

### Step 5 — Start dev server
```bash
npm run dev
# Open http://localhost:3000
```

### Step 6 — Create first invite link
Use the Supabase dashboard to directly insert an InviteLink record,
or hit POST /api/invites from an admin session:
```json
{
  "email": "your@email.com",
  "expiryDays": 14
}
```
Then navigate to: http://localhost:3000/invite/{token}

---

## Layer 1 Checklist
- [ ] `npm install` completes without errors
- [ ] `.env.local` filled with real Supabase credentials
- [ ] `npm run db:migrate` runs successfully (migration: init)
- [ ] RLS policies applied in Supabase SQL editor
- [ ] `npm run dev` starts on port 3000
- [ ] `/login` page renders correctly
- [ ] Supabase RLS policies visible in dashboard

## Layer 2 Checklist
- [ ] `/invite/{valid-token}` renders invite landing (Step 1)
- [ ] `/invite/{invalid-token}` shows 404
- [ ] `/invite/{expired-token}` redirects to /login?reason=invite_expired
- [ ] Clicking "Accept" navigates to `/onboarding?token=...&email=...`
- [ ] Step 2 (Create Account): form validation works, password strength bars animate
- [ ] Step 3 (Preferences): interests toggle correctly, city selection works
- [ ] Submitting Step 3 calls POST /api/auth/signup:
  - Creates Supabase Auth user
  - Creates User, Wallet, ChatThread, UserMembership in Postgres
  - Awards 500 welcome points in PointsLedger
  - Marks InviteLink.usedAt
- [ ] Step 4 (Welcome): shows member name, "Signature", 500 points
- [ ] "Enter Signature Lifestyle" → redirects to /home
- [ ] /home renders with bottom nav
- [ ] /login works with Supabase signInWithPassword
- [ ] Session persists on page refresh
- [ ] Unauthenticated access to /home redirects to /login

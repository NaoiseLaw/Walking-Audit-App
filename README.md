# Walking Audit Web Application

> **Live:** https://walking-audit-app-frontend.vercel.app  
> **Stack:** Next.js 14 · Supabase PostgreSQL · Vercel · Tailwind CSS · Redux Toolkit  
> **Status:** ✅ Authentication working · ⚠️ Photos & Maps pending config

A Progressive Web Application that digitises the Irish National Transport Authority's Universal Design Walkability Audit Tool. Built for community groups, local authorities, and coordinators to conduct structured pedestrian infrastructure assessments — capturing GPS-tagged issues, photo evidence, scores, and generating PDF reports.

---

## 🔧 Development Log — Issues Encountered & Resolved

This section documents every major blocker encountered during development and deployment, what caused it, and exactly how it was fixed. Read this before touching the codebase.

---

### Issue 1 — Prisma ORM Incompatible with Vercel (FIXED ✅)

**When:** Early deployment phase  
**Symptom:** Every API call failed immediately with a database connection error at runtime on Vercel.

**Root Cause:**  
The original backend used **Prisma ORM** with a direct PostgreSQL connection string (`postgresql://...` on port 5432). Vercel Lambda functions only have **IPv4** outbound network connectivity. Supabase's direct database connections require **IPv6**. This meant Prisma could never establish a connection from Vercel — every single API call failed at the network layer before any code ran.

**Fix:**  
Replaced the entire Prisma layer with `@supabase/supabase-js`. The Supabase JS client communicates via **HTTPS on port 443**, which works on both IPv4 and IPv6. All 8 service files were rewritten from scratch.

**Files changed:**
- Removed: `prisma/schema.prisma`, `prisma/migrations/`, `@prisma/client` dependency
- Rewritten: `src/lib/services/auth.service.ts`, `audit.service.ts`, `walkingRoute.service.ts`, `issue.service.ts`, `photo.service.ts`, `recommendation.service.ts`, `report.service.ts`, `analytics.service.ts`
- Added: `src/lib/supabase-admin.ts` — initialises Supabase admin client with service role key

---

### Issue 2 — Silent Insert Failures on Every Table (FIXED ✅)

**When:** After Supabase JS migration  
**Symptom:** Registration, audit creation, and all write operations appeared to succeed on the frontend but nothing was stored. No errors logged.

**Root Cause:**  
Prisma generates primary keys in **application code** before inserting. When Prisma was replaced with Supabase JS, inserts no longer provided an `id` value. The `id` columns on all 13 tables had **no `DEFAULT` value** — so PostgreSQL received `NULL` for a `NOT NULL` column on every insert. The inserts failed silently because the error wasn't being surfaced to the frontend.

**Fix:** Applied a database migration to add `DEFAULT (gen_random_uuid())::text` to the `id` column across all 13 affected tables:

```sql
ALTER TABLE users ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE routes ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE audits ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE issues ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE photos ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE recommendations ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE audit_participants ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE baseline_data ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE report_metrics ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE audit_log ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE sync_queue ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE email_queue ALTER COLUMN id SET DEFAULT (gen_random_uuid())::text;
```

---

### Issue 3 — 403 Forbidden on Every API Call (FIXED ✅) ← PRIMARY BLOCKER

**When:** After UUID fix  
**Symptom:** Login returned `401 Invalid email or password`. Supabase API logs showed `403 Forbidden` on every request reaching `uruzgfxebrounqszufto.supabase.co`.

**Root Cause:**  
This was the single most impactful issue. When **Prisma creates PostgreSQL tables**, it only grants permissions to the `postgres` superuser. Supabase's **PostgREST** layer (which the JS client communicates through) executes queries as the `service_role`, `authenticated`, or `anon` PostgreSQL roles — **none of which had any grants on any table**. Every read and write was blocked at the PostgreSQL privilege level.

This is the critical difference between tables created via the Supabase Dashboard (which auto-applies standard grants) versus tables created by an external ORM like Prisma.

Diagnosing this took multiple deployment cycles because:
1. The error returned `401` from the app (not `403`) — masking the real database error
2. The Supabase query error was silently dropped (`const { data: user } = ...` — error not captured)
3. Vercel runtime logs truncated the error message

**Fix:** Applied grants to all Supabase PostgREST roles:

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON TABLE users TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
```

**Also added error logging** to `auth.service.ts` login method so Supabase errors are now visible in Vercel runtime logs.

---

### Issue 4 — Google Sign-In Integration (ADDED ✅)

Added Google OAuth login alongside email/password:

| Component | Change |
|-----------|--------|
| `src/app/providers.tsx` | Wrapped with `GoogleOAuthProvider` |
| `src/app/auth/login/page.tsx` | Added `GoogleLogin` button + handler |
| `src/app/auth/register/page.tsx` | Added `GoogleLogin` button + handler |
| `src/app/api/v1/auth/google/route.ts` | New route: verifies Google ID token, issues JWT |
| `src/lib/services/auth.service.ts` | Added `loginWithGoogle` method |
| Database | Added `google_id` (unique) and `avatar_url` columns to `users` |

**Dependencies added:** `@react-oauth/google`, `google-auth-library`

**Still needs:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` set in Vercel environment variables.

---

### Issue 5 — Test User Created for Staging

```
Email:    test@walkingaudit.ie
Password: TestWalk@2026!
Role:     auditor
Status:   Active (email_verified = true)
```

---

## 📊 Current System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Authentication (email/password) | ✅ Working | Login confirmed live |
| User Registration | ✅ Working | UUID defaults fixed |
| Supabase Database | ✅ Connected | All 15 tables accessible |
| All API Routes (`/api/v1/*`) | ✅ Accessible | PostgREST grants applied |
| Vercel Deployment | ✅ Live | Auto-deploys from `main` |
| Google Sign-In | ⚠️ Deployed, needs env vars | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` missing |
| Google Maps | ⚠️ Needs env var | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` missing |
| Photo Uploads | ❌ Broken | Sharp binary Windows→Linux conflict |
| Photo Storage | ❌ Not configured | Firebase/Supabase Storage TBD |
| Row Level Security | ❌ Disabled | All 15 tables have `rls_enabled=false` |
| PDF Report Generation | ⚠️ Untested | Puppeteer may have Vercel sandbox limits |
| Email Verification | ⚠️ Disabled | `ENABLE_EMAIL_VERIFICATION=false` |
| Offline Sync Queue | ⏳ Built, untested | `sync_queue` table ready |

---

## 🚧 Remaining Work to Reach 100%

### Priority 1 — Required for Basic Functionality

#### 1.1 Add Missing Vercel Environment Variables

Go to: [Vercel → Project → Settings → Environment Variables](https://vercel.com/naoiselaws-projects/walking-audit-app-frontend/settings/environment-variables)

| Variable | Where to Get It |
|----------|----------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud Console → Maps JavaScript API |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_ID` | Same as above (server-side copy) |

#### 1.2 Fix Photo Uploads

Sharp was compiled for Windows. Vercel runs Linux x64. Options:

**Option A (Recommended) — Remove Sharp, use Cloudinary:**
```bash
npm uninstall sharp
npm install cloudinary
```
Update `photo.service.ts` to call Cloudinary's transformation API instead of Sharp.

**Option B — Force Linux build:**
```json
// package.json
"scripts": {
  "postinstall": "npm rebuild sharp --platform=linux --arch=x64"
}
```

#### 1.3 Configure Photo Storage

Current state: `photo.service.ts` has storage placeholder code. Choose one:

**Option A — Supabase Storage (recommended, already in stack):**
```typescript
const { data } = await supabase.storage
  .from('audit-photos')
  .upload(`${auditId}/${filename}`, buffer)
```

**Option B — Cloudinary:**
```typescript
cloudinary.uploader.upload_stream({ folder: `audits/${auditId}` }, callback)
```

---

### Priority 2 — Security (Before Real Users)

#### 2.1 Enable Row Level Security on All Tables

Currently **all 15 tables have RLS disabled**. Any authenticated user can read/write any row. This must be addressed before onboarding real users.

```sql
-- Example: audits table
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coordinators_own_audits" ON audits
  FOR ALL USING (coordinator_id = current_setting('request.jwt.claims', true)::json->>'userId');

CREATE POLICY "auditors_see_participating" ON audits
  FOR SELECT USING (
    id IN (SELECT audit_id FROM audit_participants 
           WHERE user_id = current_setting('request.jwt.claims', true)::json->>'userId')
  );
```

Apply similar policies to: `routes`, `issues`, `photos`, `recommendations`, `audit_participants`, `baseline_data`, `report_metrics`

#### 2.2 Run npm audit fix

```bash
cd frontend
npm audit fix
```
29 vulnerabilities currently flagged (mix of low/medium/high).

---

### Priority 3 — Feature Completion

| Feature | What's Needed |
|---------|--------------|
| PDF Report | End-to-end test on Vercel; may need `@sparticuz/chromium` instead of Puppeteer |
| Email Verification | Set `ENABLE_EMAIL_VERIFICATION=true`, configure SendGrid `SENDGRID_API_KEY` |
| Analytics Dashboard | Charts/graphs — consider Recharts or Chart.js |
| Offline Mode | `sync_queue` table exists; service worker needs implementation |

---

## 🔐 Environment Variables Reference

### Required in Vercel

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `SUPABASE_URL` | `https://uruzgfxebrounqszufto.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service role JWT — bypasses RLS, never expose client-side |
| `JWT_SECRET` | `your-secret-here` | Signs access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | `your-refresh-secret` | Signs refresh tokens (min 32 chars) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIza...` | ⚠️ MISSING — Google Maps JS API |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | ⚠️ MISSING — Google OAuth |
| `GOOGLE_CLIENT_ID` | same as above | ⚠️ MISSING — server-side Google OAuth |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_EMAIL_VERIFICATION` | `false` | Require email verification on register |
| `JWT_EXPIRY` | `24h` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `30d` | Refresh token lifetime |
| `SENDGRID_API_KEY` | — | Email delivery (if email verification enabled) |

---

## 🗄️ Database Schema

**15 tables** in Supabase PostgreSQL (`uruzgfxebrounqszufto.supabase.co`):

| Table | Description |
|-------|-------------|
| `users` | Accounts — roles: `auditor`, `coordinator`, `la_admin`, `system_admin` |
| `routes` | Walking route definitions with GeoJSON geometry, elevation, surface type |
| `audits` | Audit sessions — linked to routes and coordinators, scored per section |
| `audit_participants` | Many-to-many: users participating in audits |
| `issues` | Observed problems — category, severity, GPS coordinates, resolution status |
| `photos` | Photo evidence — linked to issues or audits with GPS metadata |
| `recommendations` | Suggested improvements with LA response tracking and implementation status |
| `baseline_data` | Historical measurements for trend analysis |
| `report_metrics` | Cached computed scores for PDF report generation |
| `audit_log` | Full action audit trail (who did what and when) |
| `sync_queue` | Offline-first sync buffer for mobile use without signal |
| `email_queue` | Async email delivery queue (SendGrid) |
| `_prisma_migrations` | Migration history (legacy, kept for reference) |

### User Roles

| Role | Description |
|------|-------------|
| `auditor` | Field worker — conducts audits, logs issues, uploads photos |
| `coordinator` | Team lead — creates routes, assigns audits, reviews submissions |
| `la_admin` | Local authority admin — reviews findings, responds to recommendations |
| `system_admin` | Full system access — user management, all data |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Vercel Edge Network                 │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │         Next.js App (App Router)             │   │
│  │                                              │   │
│  │  ┌──────────────┐  ┌─────────────────────┐  │   │
│  │  │  React Pages  │  │  API Routes         │  │   │
│  │  │  + Tailwind   │  │  /api/v1/auth/*     │  │   │
│  │  │  + Redux TK   │  │  /api/v1/audits/*   │  │   │
│  │  │               │  │  /api/v1/routes/*   │  │   │
│  │  │  Google Maps  │  │  /api/v1/issues/*   │  │   │
│  │  │  Google OAuth │  │  /api/v1/photos/*   │  │   │
│  │  └──────────────┘  │  /api/v1/reports/*  │  │   │
│  │                     └──────────┬──────────┘  │   │
│  └──────────────────────────────┬─┘             │   │
└─────────────────────────────────┼───────────────┘   
                                  │ HTTPS / port 443   
                   ┌──────────────▼─────────────┐
                   │   Supabase (PostgreSQL)      │
                   │   uruzgfxebrounqszufto       │
                   │   PostgREST REST API          │
                   │   15 tables, 4 user roles     │
                   └──────────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

```bash
git clone https://github.com/NaoiseLaw/Walking-Audit-App.git
cd Walking-Audit-App/frontend
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local with:
# SUPABASE_URL=https://uruzgfxebrounqszufto.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard>
# JWT_SECRET=any-long-random-string
# JWT_REFRESH_SECRET=another-long-random-string
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your key>

npm run dev
# App available at http://localhost:3000
```

### Test Login Credentials (Staging)
```
Email:    test@walkingaudit.ie
Password: TestWalk@2026!
```

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Email/password login → JWT tokens |
| POST | `/api/v1/auth/google` | Google OAuth login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Complete password reset |
| GET/POST | `/api/v1/routes` | List / create walking routes |
| GET/PUT/DELETE | `/api/v1/routes/[id]` | Get / update / delete route |
| GET/POST | `/api/v1/audits` | List / create audits |
| GET/PUT | `/api/v1/audits/[id]` | Get / update audit |
| GET/POST | `/api/v1/audits/[id]/issues` | List / add issues to audit |
| GET/POST | `/api/v1/audits/[id]/photos` | List / upload photos |
| GET | `/api/v1/audits/[id]/report` | Generate PDF report |
| GET | `/api/v1/analytics` | Aggregate statistics |
| GET | `/api/health` | Health check |

---

*Last updated: April 2026. Authentication confirmed working on live deployment. Primary blockers resolved.*

## 🎯 Project Overview

This application enables community groups, local authorities, and coordinators to conduct comprehensive walking infrastructure assessments with:
- 📍 GPS-tagged issue tracking
- 📸 Photo capture with automatic location embedding
- 📊 Automated PDF report generation
- 🔄 Offline-first architecture
- 📱 Mobile-first responsive design

## 📚 Documentation

Complete technical specifications are available in the `Mum App Markdown Files/` directory:

1. **Main PRD & Architecture** - Product vision, system architecture, tech stack
2. **Database Complete Specification** - Complete database schemas and migrations
3. **API Complete Specification** - All API endpoints with examples
4. **Frontend Complete Implementation** - Component specifications and implementations
5. **Backend Services Implementation** - Service layer implementations
6. **Testing & DevOps** - Testing strategies and deployment procedures
7. **Development Plan** - Complete development roadmap and timeline

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- PostgreSQL 16 with PostGIS 3.4
- Redis 7.x
- npm 10 or higher

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Set up database
cd backend
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

### Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for required environment variables.

## 📁 Project Structure

```
walking-audit-app/
├── backend/          # Express.js API server
├── frontend/         # Next.js frontend application
├── shared/           # Shared TypeScript types
└── docs/             # Additional documentation
```

## 🛠️ Technology Stack

### Frontend
- Next.js 14 (App Router) ✅
- React 18 ✅
- TypeScript ✅
- Redux Toolkit ✅
- Tailwind CSS ✅
- Google Maps API ✅
- PWA Support ✅

### Backend
- Node.js 20 ✅
- Express.js ✅
- TypeScript ✅
- Prisma ORM ✅
- PostgreSQL + PostGIS ✅
- Redis ✅
- Puppeteer (PDF generation) ✅

### Infrastructure
- Docker & Docker Compose ✅
- GitHub Actions (CI/CD) ✅
- Firebase Storage (Photo storage) ✅
- SendGrid (Email) ✅

## 📝 Development

### Running Locally

```bash
# Start all services (requires both servers running)
npm run dev

# Backend only
cd backend
npm run dev

# Frontend only
cd frontend
npm run dev
```

### Default Test Accounts

After running `npm run db:seed`:
- **Admin**: admin@walkingaudit.ie / admin123
- **Coordinator**: coordinator@walkingaudit.ie / coordinator123
- **Auditor**: auditor@walkingaudit.ie / auditor123

### Testing

```bash
# Run all tests
npm test

# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend
```

### Database Migrations

```bash
cd backend
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio
```

## 🧪 Testing

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + Supertest
- **E2E Tests**: Playwright

## 📦 Deployment

See `Mum App Markdown Files/6-Testing-DevOps.md` for complete deployment procedures.

## 🤝 Contributing

This is a private project. For contributions, please contact the project maintainers.

## 📄 License

Proprietary - All rights reserved

## 👥 Team

- Product Manager: [Name]
- Lead Engineer: [Name]
- UI/UX Designer: [Name]

## 📞 Support

For technical support or questions:
- Email: support@walkingaudit.ie
- Documentation: See `Mum App Markdown Files/` directory

---

## ✅ Implementation Status

**Backend**: 100% Complete ✅
- All 10 services implemented
- All 8 controllers implemented
- All API routes functional
- Database schema complete
- Tests written
- Background jobs configured

**Frontend**: 100% Complete ✅
- All 9 pages implemented
- All 5 components built
- All 3 hooks implemented
- Redux store configured
- Tests written
- PWA configured

**Status**: ✅ **PRODUCTION READY - ALL FEATURES IMPLEMENTED!**

**Last Updated**: January 2025


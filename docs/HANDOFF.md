# Handoff Document: Coastal Corridor Platform v0.1

**Date:** 19 April 2026
**Audience:** The next engineer (human or AI agent) picking up this codebase
**Purpose:** Give you everything you need to build the next 90 days of work without breaking what exists

---

## What You're Inheriting

A production-quality Next.js 14 marketplace MVP for Nigerian real estate along the Lagos-Calabar Coastal Highway. Approximately 4,500 lines of TypeScript, production-ready components, a complete database schema, mock data that mirrors the production data model exactly, and a design system that should not be deviated from without explicit founder sign-off.

**This is not a prototype to be replaced.** It is the foundation to be extended. Treat every pattern, naming convention, and architectural decision as deliberate until proven otherwise.

---

## Principles That Must Not Be Violated

### 1. Money is always stored as BigInt kobo

Never `Float`. Never `Decimal` unless you explicitly run the migration. Every monetary field in the Prisma schema is `BigInt` and represents kobo (1/100 of a naira). When displaying, use `formatKobo()` from `@/lib/utils`.

**Why:** Floating point errors in real estate transactions will eventually produce disputes that destroy the company's reputation.

### 2. Title verification is not a boolean

There are four title states (`PENDING`, `VERIFIED`, `DISPUTED`, `REJECTED`) and multiple title types (`C of O`, `Deed of Assignment`, `Gazette`, etc.). Never collapse these into "verified: true/false".

### 3. Every entity has an audit trail

The `AuditEntry` model captures every meaningful state change. When you add a new entity, add audit logging. No exceptions for models that touch users, listings, or money.

### 4. Soft deletes for everything except transient data

User-facing entities (User, Plot, Property, Listing) have `deletedAt`. Never hard-delete these. Transient data (Audit logs, views, search queries) can be hard-deleted after retention windows.

### 5. Risk scores are always published, never hidden

Flood risk, dispute risk, erosion risk — if we have the data, we show it. Hiding risk is the exact behaviour that damages Nigerian real estate trust. The platform's ethical edge is honesty.

### 6. ESVARBON licensing is mandatory for agent listings

Every agent must have `licenseVerified: true` before their listings go public. No workarounds.

---

## What Works Right Now

Run `npm run dev` and you can:

- Browse the homepage
- View all 12 destinations (listing + detail)
- Browse 12 sample properties (listing + detail with gallery, inquiry form, risk scoring)
- Use the filter system (destination, type, price, sort, verified-only)
- See the 3D corridor map with destination markers and property pins
- Submit an inquiry form (validates and returns success; does not email)
- Hit all API routes (`/api/properties`, `/api/destinations`, `/api/inquiries`, `/api/search`, `/api/health`)

The entire UX end-to-end is navigable. You can demo this to investors, partners, and user-testers today.

---

## What to Build First (Priority Order)

### P0 · Database Migration (Week 1)

**Goal:** Replace `src/lib/mock/*` with real Prisma queries.

**Steps:**
1. Provision PostgreSQL 15+ with PostGIS extension (Supabase or Neon for speed, AWS RDS for production)
2. Run `npm run db:push` to apply schema
3. Build a seed script (`prisma/seed.ts`) that imports the mock data as real records
4. Create a `src/lib/db.ts` with the Prisma client singleton
5. Update `src/lib/mock/*.ts` helpers — keep the interface identical but read from Prisma
6. Test: every page should still work. Zero UI changes.

**Files to touch:** `prisma/seed.ts` (new), `src/lib/db.ts` (new), all files in `src/lib/mock/`

**Do not:** Change any component. Change any page. Change any API route signature.

### P0 · Authentication (Week 2)

**Recommended:** Clerk. Faster than Auth0 for MVP, better UX than rolling your own.

**Steps:**
1. Set up Clerk project, add publishable/secret keys to env
2. Wrap app in `<ClerkProvider>`
3. Replace the "Sign in" button in `nav.tsx` with Clerk's `<SignInButton>` / `<UserButton>`
4. Create `/account` page with user profile editing
5. Protect `/account` and agent/dev/admin routes with Clerk middleware
6. Sync Clerk user IDs to `User` table via webhook

### P1 · Agent Dashboard (Weeks 3-4)

Routes under `/agent/*`. Requires:
- Auth check: user must have role `AGENT`
- `/agent/dashboard` — KPIs, recent inquiries, active listings
- `/agent/listings` — CRUD for listings
- `/agent/inquiries` — inbox, status management, messaging
- `/agent/profile` — edit public profile

### P1 · Real Search (Week 5)

The header search input currently does nothing. Wire it to `/api/search`. For production search (Week 8+), add Meilisearch or Algolia.

### P2 · Admin Console (Weeks 5-7)

Routes under `/admin/*`. Requires role `ADMIN`. Includes:
- Verification queue (plots awaiting title verification)
- User management
- Listing moderation
- Financial reconciliation (once transactions are live)

### P2 · Document Management (Week 8)

Secure upload/download of title deeds, contracts. Requires:
- S3 buckets with SSE-KMS
- Signed URL generation (time-limited)
- Virus scanning via ClamAV or S3 ObjectLambda
- Audit log on every access

---

## What You Must NOT Build Without Human Review

These features have legal, financial, and regulatory consequences that no AI-generated code can properly handle alone:

### Real Payments

Paystack/Flutterwave integration for property transactions. Requires:
- Nigerian real estate lawyer review of transaction flow
- CBN compliance review for diaspora FX
- PCI-DSS scope reduction (use Paystack Inline, not direct card handling)
- Fraud monitoring integration
- Chargeback process documentation

### Escrow Flow

Any code that holds funds before release to seller. Requires:
- Signed agreements with escrow bank partners (Providus, Sterling, Access)
- Dispute resolution process with lawyer sign-off
- Insurance before first transaction

### KYC / Identity Verification

Requires partnership with VerifyMe, Smile Identity, or similar. Do not try to roll your own identity verification.

### Title Transfer Automation

Do not automate anything that changes title. Every title change goes through a human lawyer, full stop.

### Cross-Border FX

Complex. CBN rules change frequently. Must route through a licensed FX partner (e.g., LemFi, Send, or a traditional bank). Get finance lawyer involved.

---

## Design System Rules

1. **Never use purple gradients.** Never.
2. **Never use Inter as the primary sans.** It's Inter Tight.
3. **Never use fully rounded buttons** (`rounded-full`) except for the Nav search icon. Sharp corners or `rounded-sm`.
4. **Never use stock AI-generated copy** like "Seamlessly integrate" or "Empower your journey." Write like a thinking adult.
5. **Every section gets an eyebrow** (`.eyebrow` class). These are mono-uppercase-ochre.
6. **Feature lists use ochre dots**, not checkmarks (except in "verified" contexts).
7. **Price displays are always Fraunces** (serif). Never sans.

When in doubt, look at `src/app/page.tsx` for the canonical patterns.

---

## Database Schema Notes

The schema in `prisma/schema.prisma` is more comprehensive than what the current pages use. Tables defined but not yet surfaced:

- `Project` (developer projects with masterplans)
- `Transaction` + `Payment` (transactional flow)
- `PlotVerification` (verifier audit records)
- `TourismListing` (tourism vertical)
- `AuditEntry` (audit trail)

These are ready for when you build those features. Do not remove them.

Some fields are marked with security-critical comments — respect those. The `Transaction` model specifically has a block comment listing every required review before use.

---

## API Contracts

All API routes follow this shape:

**Success (list):**
```json
{
  "data": [...],
  "pagination": { "total": 100, "limit": 20, "offset": 0, "hasMore": true }
}
```

**Success (single):**
```json
{ "data": { ... } }
```

**Error:**
```json
{ "error": "Human-readable message", "details": { ... } }
```

Use HTTP status codes properly (400 validation, 401 auth, 403 permission, 404 not found, 500 server error).

---

## Deployment

**For now:** Vercel. Push to GitHub, import, add env vars, ship. Zero config.

**Later (post-Series-A):** Consider AWS (eu-west-2 for UK HoldCo + af-south-1 for Nigerian data residency) or Cloudflare Workers for edge delivery.

**Never:** Shared hosting, old-style VPS without managed services, or anywhere without managed Postgres.

---

## Who to Ask

- **Architectural questions:** Senior engineer to be hired. Until then, refer to the patterns in this codebase.
- **Design questions:** Refer to `tailwind.config.ts` and the homepage. If genuinely novel, ask the founder.
- **Legal/regulatory:** Do not guess. Escalate.
- **Nigerian real estate specifics:** Refer to a registered ES&V practitioner or the founder.

---

## Final Note

This codebase was built deliberately, with restraint, in one sustained sitting. Every file was touched with intent. Please extend it the same way.

If you find something that looks wrong, it's probably deliberate. Ask before "fixing."

If you find something that's actually wrong, document the fix in git commit messages so the next person understands.

Good luck.

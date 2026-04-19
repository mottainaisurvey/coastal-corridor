# Coastal Corridor Platform

> The verified real estate, tourism and investment platform for Nigeria's 700km Lagos-Calabar Coastal Highway.

**Version:** 0.1.0 (MVP — early user testing and partner demos)
**Status:** Pre-production. Not for real-money transactions.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## What's in This MVP

### Working Surfaces

- ✅ **Homepage** (`/`) — hero, verification promise, featured properties, corridor spine
- ✅ **Properties listing** (`/properties`) — browse, filter by destination/type/price, sort, grid/list view
- ✅ **Property detail** (`/properties/[slug]`) — gallery lightbox, full specs, risk assessment, title verification, inquiry form, embedded map
- ✅ **Destinations listing** (`/destinations`) — all 12 grouped by type
- ✅ **Destination detail** (`/destinations/[slug]`) — full profile, stats, features, properties list
- ✅ **Agents listing** (`/agents`) — all licensed agents
- ✅ **Map view** (`/map`) — interactive corridor map with destinations & property markers
- ✅ **API routes** — `/api/properties`, `/api/destinations`, `/api/inquiries`, `/api/search`, `/api/health`

### Stubbed (Functional But Not Production-Wired)

- ⚠️ **Inquiry submission** — validates & returns success but doesn't email or persist
- ⚠️ **Search bar** — UI present, `/api/search` works, not wired into header input
- ⚠️ **Authentication** — "Sign in" link exists, no Clerk integration yet
- ⚠️ **Virtual tour** — button exists, no Matterport wired

### Deliberately Absent (Must Be Built by Human Engineers)

- ❌ **Real transactions** — escrow, payments, title transfer
- ❌ **KYC / identity verification**
- ❌ **Agent/developer dashboards**
- ❌ **Admin console**
- ❌ **VR build** (Unity project is a separate repo)
- ❌ **Live Parcel Fabric integration**
- ❌ **State registry API integrations**

---

## Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + custom design tokens
- **Database:** PostgreSQL + PostGIS (schema defined in `prisma/schema.prisma`; not yet migrated)
- **ORM:** Prisma
- **Maps:** MapLibre GL JS (production), Cesium (VR/3D premium tier)
- **Icons:** Lucide
- **Validation:** Zod

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout with Nav + Footer
│   ├── globals.css           # Tailwind + design tokens
│   ├── properties/           # Properties pages
│   ├── destinations/         # Destinations pages
│   ├── agents/               # Agents pages
│   ├── map/                  # 3D map view
│   └── api/                  # API routes
├── components/               # Shared React components
│   ├── nav.tsx
│   ├── footer.tsx
│   ├── property-card.tsx
│   ├── destination-card.tsx
│   ├── gallery-viewer.tsx
│   └── inquiry-form.tsx
└── lib/
    ├── utils.ts              # Formatters, cn(), design helpers
    └── mock/
        ├── types.ts          # TypeScript interfaces
        ├── destinations.ts   # 12 corridor destinations
        ├── properties.ts     # 12 property listings
        └── agents.ts         # 6 agents + 3 developers

prisma/
└── schema.prisma             # Full database schema (22 tables)
```

### Design System

The aesthetic is **infrastructure intelligence**, not tourism brochure:

- **Palette:** `ink` (near-black), `paper` (warm off-white), ocean teal, laterite red, savanna ochre, sage green — Nigerian-coast inspired
- **Typography:** Fraunces (display serif, variable), Inter Tight (sans), JetBrains Mono (mono)
- **Composition:** Dark hero + paper content. Generous negative space. No rounded-full buttons. Sharp-cornered chips in monospace.
- **Motion:** Minimal. Subtle hover elevations. No decorative animation.

See `tailwind.config.ts` for design tokens.

---

## Deployment

### Vercel (Recommended for MVP)

1. Push to GitHub (private repo recommended)
2. Import into Vercel
3. Set environment variables from `.env.example`
4. Deploy

Zero-config. Works out of the box.

### Alternative: Fly.io, Railway, Render

Standard Next.js deployment. No special requirements except:

- Node 20+
- Enable PostGIS extension on your Postgres instance

### Database Setup (Production)

```bash
# Create database with PostGIS
psql -U postgres -c "CREATE DATABASE corridor;"
psql -U postgres -d corridor -c "CREATE EXTENSION postgis;"

# Push schema
npm run db:push

# Seed initial data (build the seed script first)
npm run db:seed
```

---

## Production Readiness Checklist

### Before Any Real User Traffic

- [ ] Replace mock data with real database queries
- [ ] Integrate Clerk for authentication
- [ ] Wire Sentry for error tracking
- [ ] Set up Plausible or PostHog for analytics
- [ ] Add rate limiting middleware (Upstash Redis)
- [ ] Configure Cloudflare Turnstile for forms
- [ ] Configure Postmark/SendGrid for emails
- [ ] Set up S3 buckets for documents + images (separate buckets, different encryption)
- [ ] Add CSP headers, HSTS, security middleware
- [ ] Penetration test by a qualified security firm

### Before Any Transactional Flow

These are **non-negotiable**. Do not process a single naira without all of the below:

- [ ] Nigerian real estate lawyer review of every contract template
- [ ] CBN Certificate of Capital Importation setup for diaspora inbound FX
- [ ] Escrow partner (Providus / Sterling / Access) agreements signed
- [ ] Paystack + Flutterwave go-live approval (from merchant review)
- [ ] NDPR compliance audit
- [ ] Professional indemnity insurance (minimum ₦500M cover)
- [ ] Cyber insurance
- [ ] Incident response plan documented and rehearsed
- [ ] ESVARBON compliance review for agent listings
- [ ] Consumer complaints and dispute resolution SLAs

### Before Fundraising Demos

- [x] Working marketplace with verified listings ← you are here
- [ ] 3D map view with plot overlays
- [ ] Minimum 50 real listings (not mocks) across 3+ destinations
- [ ] Real agent verifications (5+ live)
- [ ] End-to-end inquiry flow demonstrated
- [ ] Pitch deck aligned with platform
- [ ] Financial model
- [ ] Data room ready (UK HoldCo + Nigerian OpCo docs)

---

## For the Next Engineer (or AI Agent)

### What to Build Next (in order of value)

1. **Wire up the database** — migrate from mock data to Prisma queries. Start with destinations and properties read-only. Estimated effort: 3–5 days.

2. **Authentication** — integrate Clerk. Add sign-up, sign-in, email verification, magic links. Effort: 2 days.

3. **Agent dashboard** — `/agent/dashboard` with listing management, lead inbox, performance stats. Effort: 2 weeks.

4. **Developer portal** — `/developer/dashboard` for bulk listing, project management, masterplan uploads. Effort: 2 weeks.

5. **Admin console** — `/admin` with verification queue, user management, financial reconciliation. Effort: 3 weeks.

6. **Real search** — wire the header search input to `/api/search`. Later replace with Meilisearch or Algolia. Effort: 1 day basic / 1 week advanced.

7. **Saved properties + accounts** — account page, saved searches, viewing history. Effort: 1 week.

8. **Inquiry persistence + notifications** — database-backed inquiries, email confirmation, agent Slack ping. Effort: 3 days.

9. **Document management** — secure upload/download of title deeds, contracts. S3 signed URLs, virus scanning, audit trail. Effort: 2 weeks.

10. **Payments integration** — Paystack + Flutterwave for bookings/reservations (not full property transactions yet). Effort: 2 weeks. **REQUIRES SECURITY REVIEW.**

### What NOT to Build Without Human Architectural Review

- Escrow flow
- Title transfer automation
- KYC pipeline
- Cross-border FX routing
- Real money in/out of any account

These each have legal, regulatory, and financial consequences that AI code generation cannot properly address. Get a senior engineer + lawyer involved.

---

## Useful Scripts

```bash
npm run dev           # Dev server on :3000
npm run build         # Production build
npm run type-check    # TypeScript validation
npm run lint          # ESLint
npm run db:push       # Apply Prisma schema to database
npm run db:generate   # Regenerate Prisma client
npm run db:seed       # Seed initial data
```

---

## License & Confidentiality

Private repository. Do not distribute. Code belongs to Coastal Corridor Ltd (UK HoldCo).

For questions: see founder.

---

*Built with deliberate pace. Every design decision in this codebase can be defended.*

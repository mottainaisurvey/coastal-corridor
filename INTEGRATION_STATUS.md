# Integration Status — Coastal Corridor Platform

**Last Updated**: May 23, 2026
**Platform Status**: ✅ **PRODUCTION LIVE**
**Version**: MVP v0.3 — Phase 5.1 complete

---

## 📊 Executive Summary

| Component | Status | Health | Last Verified |
|-----------|--------|--------|----------------|
| **Platform** | ✅ Live | Operational | May 23, 2026 |
| **Domain** | ✅ coastalcorridor.africa | Active | April 19, 2026 |
| **Database** | ✅ Connected | Operational | May 23, 2026 |
| **Authentication** | ✅ Active | Clerk Production | May 2026 |
| **Email Service** | ✅ Active | Operational | April 19, 2026 |
| **Payments — Paystack** | ✅ Live | Production | May 2026 |
| **Payments — Stripe CC** | ⚠️ Ready | Test Mode | May 2026 |
| **KYC — Smile Identity** | ⚠️ Ready | Framework | April 19, 2026 |
| **Virtual Tours** | ⚠️ Ready | Framework | April 19, 2026 |
| **Owambe Channel Integration** | ✅ **Phase 5.1 Complete** | Bidirectional | May 23, 2026 |

**Overall Health**: 🟢 **OPERATIONAL**

---

## 🌐 Domain & Hosting

### Primary Domain: coastalcorridor.africa

- **Status**: ✅ **LIVE**
- **Primary URL**: https://coastalcorridor.africa
- **Backup URL**: https://coastal-corridor.vercel.app
- **Registrar**: HostAfrica (https://my.hostafrica.com)
- **Nameservers**: ns1.vercel-dns.com / ns2.vercel-dns.com (Vercel DNS)
- **DNS Provider**: Vercel (nameservers updated April 19, 2026)
- **SSL**: ✅ Auto-renewed via Vercel

### Vercel Hosting

- **Account**: mottaianiafricawaste-4821
- **Project (production)**: coastal-corridor
- **Project (staging)**: coastal-corridor-staging
- **Dashboard**: https://vercel.com/owambe/coastal-corridor
- **GitHub Auto-Deploy**: ✅ Connected — mottainaisurvey/coastal-corridor → main branch
- **Deployments**: https://vercel.com/owambe/coastal-corridor/deployments
- **Staging Deployments**: https://vercel.com/owambe/coastal-corridor-staging/deployments
- **Environment Variables**: https://vercel.com/owambe/coastal-corridor/settings/environment-variables
- **Region**: Global CDN
- **Build Time**: ~45 seconds

---

## 🗂️ Subdomain Registry

All 14 subdomains are registered on the Vercel project. CNAME DNS records point to `cname.vercel-dns.com`.

### Clerk Authentication Subdomains (DNS Verified)

| Subdomain | Purpose | DNS | SSL |
|-----------|---------|-----|-----|
| `clerk.coastalcorridor.africa` | Clerk Frontend API | ✅ Verified | ✅ Active |
| `accounts.coastalcorridor.africa` | Clerk Account Portal (sign-in/sign-up UI) | ✅ Verified | ✅ Active |
| `clkmail.coastalcorridor.africa` | Clerk transactional email sending | ✅ Verified | ✅ Active |
| `clk._domainkey.coastalcorridor.africa` | Clerk DKIM signing key 1 | ✅ Verified | N/A |
| `clk2._domainkey.coastalcorridor.africa` | Clerk DKIM signing key 2 | ✅ Verified | N/A |

### Platform Service Subdomains

| Subdomain | Purpose | Status | Notes |
|-----------|---------|--------|-------|
| `www.coastalcorridor.africa` | Redirect to apex domain | ✅ Configured | 308 permanent → coastalcorridor.africa |
| `api.coastalcorridor.africa` | Dedicated API endpoint | ✅ Registered | Routes to /api/* on main app |
| `admin.coastalcorridor.africa` | Admin dashboard | ✅ Registered | Routes to /admin/dashboard |
| `agent.coastalcorridor.africa` | Agent portal | ✅ Registered | Routes to /agent/dashboard |
| `map.coastalcorridor.africa` | 3D/2D map viewer | ✅ Registered | Routes to /map |

### Future Service Subdomains (Reserved & Registered)

| Subdomain | Purpose | Status | Activation Trigger |
|-----------|---------|--------|--------------------|
| `pay.coastalcorridor.africa` | Payment gateway redirect | ✅ Registered | Paystack live — active |
| `kyc.coastalcorridor.africa` | KYC verification flow | ✅ Registered | Add Smile Identity credentials |
| `tours.coastalcorridor.africa` | Virtual tour embed host | ✅ Registered | Upload Matterport tours |
| `cdn.coastalcorridor.africa` | Media/image CDN | ✅ Registered | Configure Cloudflare/CloudFront |
| `mail.coastalcorridor.africa` | Custom email sending domain | ✅ Registered | Verify in Postmark dashboard |
| `status.coastalcorridor.africa` | Platform uptime status page | ✅ Registered | Set up Betterstack/UptimeRobot |
| `docs.coastalcorridor.africa` | API documentation | ✅ Registered | Deploy Swagger/Redoc |

---

## 🔐 Authentication — Clerk

- **Status**: ✅ **ACTIVE**
- **Instance Type**: ✅ **Production**
- **Domain**: coastalcorridor.africa
- **Dashboard**: https://dashboard.clerk.com
- **App ID**: app_3CZr01R65zpiCf4HggyW7fvXCHA
- **Production Instance ID**: ins_3CaCbSEKiQautN22Hcg0XMpFxld

| Item | Status | Details |
|------|--------|---------|
| DNS Configuration | ✅ Verified | All 5 CNAME records confirmed by Clerk |
| SSL Certificates | ✅ Active | Issued and auto-renewing |
| Publishable Key | ✅ Set in Vercel | `pk_live_*` production key |
| Secret Key | ✅ Set in Vercel | `sk_live_*` production key |
| Sign-In UI | ✅ Active | Live at accounts.coastalcorridor.africa |
| Email/Password | ✅ Enabled | Active |
| OAuth2 | ✅ Active | Google OAuth configured and active |
| User Management | ✅ Active | Full user management at dashboard.clerk.com |

---

## 🗄️ Database — Supabase PostgreSQL

- **Status**: ✅ **CONNECTED**
- **Provider**: Supabase (managed PostgreSQL)
- **Project URL**: https://zpgdjffavjtccyjfshnu.supabase.co
- **Region**: us-east-1
- **Backup**: Automatic daily
- **Encryption**: At rest and in transit

| Item | Status |
|------|--------|
| DATABASE_URL | ✅ Set in Vercel |
| Schema (Prisma) | ✅ Defined — v0.3 (Phase 5.1 migrations applied) |
| Migrations | ✅ Current — latest: `20260522000000_add_reservation_sync_fields` |
| Seed Data | ✅ Complete |
| PostGIS Extension | ⚠️ Optional — enable for geospatial queries |

### Schema changes since v0.2

| Migration | Date | Description |
|-----------|------|-------------|
| `20260522000000_add_reservation_sync_fields` | May 22, 2026 | Adds `owambeSyncAttempts INT DEFAULT 0` and `owambeSyncError TEXT` to `Reservation` model (outbox pattern for CC-STAYS-RESERVATION-SENDER-01) |

---

## 📧 Email — Postmark

- **Status**: ✅ **ACTIVE**
- **Account**: collanomics
- **Dashboard**: https://account.postmarkapp.com

| Item | Status |
|------|--------|
| API Token | ✅ Set in Vercel |
| Inquiry Notifications | ✅ Active |
| Payment Confirmations | ✅ Active |
| KYC Notifications | ✅ Ready |
| Custom Sender Domain | ⚠️ Pending — verify `mail.coastalcorridor.africa` in Postmark |

---

## 💳 Payments — Paystack

- **Status**: ✅ **LIVE — Production**
- **Implementation**: Payment initiation, webhook handling, refunds

| Item | Status |
|------|--------|
| Paystack adapter (`/src/lib/paystack-adapter.ts`) | ✅ Live |
| Webhook handler (`/api/webhooks/paystack`) | ✅ Live |
| HMAC signature verification | ✅ Active |
| Refund flow | ✅ Active — used in 409 Conflict path (CC-STAYS-RESERVATION-SENDER-01) |
| Live keys | ✅ Set in Vercel |

---

## 💳 Payments — Stripe (CC Channel)

- **Status**: ⚠️ **TEST MODE — NOT LIVE**
- **Implementation**: Stripe CC webhook handler for channel payment events

| Item | Status |
|------|--------|
| Stripe CC webhook handler (`/api/webhooks/stripe-cc`) | ✅ Built |
| HMAC/signature verification | ✅ Built |
| Live keys | ❌ Not configured |

**To Activate**: Add `STRIPE_SECRET_KEY=sk_live_...` and `STRIPE_WEBHOOK_SECRET=whsec_...` to Vercel.

---

## 🪪 KYC — Smile Identity

- **Status**: ⚠️ **FRAMEWORK READY — NOT LIVE**
- **Service**: Nigerian identity verification (BVN, NIN, liveness detection)

| Item | Status |
|------|--------|
| KYC service (`/src/lib/kyc.ts`) | ✅ Built |
| Verification API (`/api/kyc/verify`) | ✅ Built |
| Webhook handler (`/api/webhooks/kyc`) | ✅ Built |
| API credentials | ❌ Not configured |

**To Activate**: Sign up at https://usesmileid.com → Get API key → Add `SMILE_IDENTITY_API_KEY` and `SMILE_IDENTITY_PARTNER_ID` to Vercel.

---

## 🏠 Virtual Tours — Matterport

- **Status**: ⚠️ **FRAMEWORK READY — NOT LIVE**

| Item | Status |
|------|--------|
| Tour embed component | ✅ Built |
| Tour buttons on property pages | ✅ Present |
| Matterport account | ❌ Not configured |
| Tour URLs linked to properties | ❌ Not linked |

**To Activate**: Upload tours at https://matterport.com → Get embed URLs → Update property records in database.

---

## 🔗 Owambe Channel Integration

- **Status**: ✅ **Phase 5.1 COMPLETE — Bidirectional**
- **Direction**: CC → Owambe (outbound) + Owambe → CC (inbound webhooks)
- **Contract references**: §07 STAYS RESERVATIONS INBOUND, Amendment 008 (snake_case wire convention)

### Inbound (Owambe → CC)

| Event Type | Handler | Commit | Status |
|---|---|---|---|
| `reservation.cancelled` | `handleReservationCancelled()` | pre-Phase 5.1 | ✅ Active |
| `reservation.no_show` | `handleReservationNoShow()` | pre-Phase 5.1 | ✅ Active |
| `reservation.guest_checked_in` | `handleReservationGuestCheckedIn()` | pre-Phase 5.1 | ✅ Active |
| `reservation.guest_checked_out` | `handleReservationGuestCheckedOut()` | pre-Phase 5.1 | ✅ Active |
| `reservation.refunded` | `handleReservationRefunded()` | pre-Phase 5.1 | ✅ Active |
| `booking.cancelled` | `handleBookingCancelled()` | pre-Phase 5.1 | ✅ Active |
| `booking.no_show` | `handleBookingNoShow()` | pre-Phase 5.1 | ✅ Active |
| `booking.completed` | `handleBookingCompleted()` | pre-Phase 5.1 | ✅ Active |
| `booking.refunded` | `handleBookingRefunded()` | pre-Phase 5.1 | ✅ Active |
| `property.deactivated` | `handlePropertyDeactivated()` | pre-Phase 5.1 | ✅ Active |
| `reservation.checked_in` | `handleReservationGuestCheckedIn()` (alias) | `fa09e0e` | ✅ Active — CC-WEBHOOK-HANDLERS-01 |
| `reservation.checked_out` | `handleReservationGuestCheckedOut()` (alias) | `fa09e0e` | ✅ Active — CC-WEBHOOK-HANDLERS-01 |
| `reservation.status_changed` | `handleReservationStatusChanged()` | `fa09e0e` | ✅ Active — CC-WEBHOOK-HANDLERS-01 |

**Inbound route**: `/api/v1/channel/webhooks/inbound`
**Security**: HMAC-SHA256 signature verification on all inbound events

### Outbound (CC → Owambe)

| Feature | File | Commit | Status |
|---|---|---|---|
| Stays reservation sender dispatcher | `src/lib/sync-stays-reservation.ts` | `72efe93` | ✅ Active — CC-STAYS-RESERVATION-SENDER-01 |
| Cron trigger (every 5 min) | `src/app/api/cron/sync-stays-reservations/route.ts` | `72efe93` | ✅ Active |
| Experience booking sender | `src/lib/sync-experience-booking.ts` | pre-Phase 5.1 | ✅ Active |
| Cron trigger — experience bookings | `src/app/api/cron/sync-owambe-bookings/route.ts` | pre-Phase 5.1 | ✅ Active |
| Reconciliation cron (every 6 hrs) | `src/app/api/cron/reconcile-owambe/route.ts` | pre-Phase 5.1 | ✅ Active |

### Outbound payload contract — Stays Reservation (§07 + Amendment 008)

All fields use snake_case wire convention per Amendment 008:

| Field | Type | Notes |
|---|---|---|
| `cc_reservation_id` | string | CC internal UUID |
| `owambe_property_id` | string | Owambe-native property ID |
| `owambe_room_id` | string | Owambe-native room ID |
| `check_in_date` | string | ISO 8601 date (YYYY-MM-DD) |
| `check_out_date` | string | ISO 8601 date (YYYY-MM-DD) |
| `number_of_guests` | number | |
| `total_amount` | string | Decimal string |
| `currency` | string | e.g. `NGN` |
| `channel_commission_amount` | string | Decimal string |
| `channel_commission_percent` | string | Decimal string |
| `net_to_host` | string | Decimal string |
| `guest_owambe_user_id` | string | |
| `guest_email` | string | |
| `guest_phone` | string | |
| `special_requests` | string \| null | |
| `paystack_reference` | string | |

### Outbox behaviour — Stays Reservation

| Scenario | Behaviour |
|---|---|
| 201 Created | `owambeReservationId` stored; `owambeSyncError` cleared |
| 409 Conflict | Paystack refund initiated; `status → FAILED`; `AuditEntry` created (`action = 'reservation_sync_conflict'`) |
| 4xx (non-409) | `owambeSyncAttempts` incremented; `owambeSyncError` stored |
| Network/timeout | `owambeSyncAttempts` incremented (transient; retried next cron pass) |
| `owambeSyncAttempts >= 3` | Excluded from outbox (dead-letter) |
| Idempotency | `outboundIdempotencyKey` (UUID v4) set once at first attempt; reused on retries |

### Cron schedule summary

| Cron | Schedule | Purpose |
|---|---|---|
| `sync-owambe-bookings` | `*/5 * * * *` | Experience booking outbox |
| `sync-stays-reservations` | `*/5 * * * *` | Stays reservation outbox — added Phase 5.1 |
| `reconcile-owambe` | `0 */6 * * *` | Bidirectional reconciliation |
| `cleanup-idempotency-cache` | `0 3 * * *` | Idempotency cache pruning |
| `cleanup-stale-bookings` | `30 3 * * *` | Stale booking cleanup |

---

## 📱 API Routes

### Channel API (Owambe Integration)

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/v1/channel/webhooks/inbound` | POST | ✅ Live | Inbound Owambe webhook dispatcher |
| `/api/v1/channel/stays/reservations` | POST | ✅ Live | Outbound stays reservation (callOwambe target) |
| `/api/v1/channel/stays/properties` | GET/POST | ✅ Live | Stays property management |
| `/api/cron/sync-owambe-bookings` | GET | ✅ Live | Experience booking outbox cron |
| `/api/cron/sync-stays-reservations` | GET | ✅ Live | Stays reservation outbox cron — added Phase 5.1 |
| `/api/cron/reconcile-owambe` | GET | ✅ Live | Reconciliation cron |
| `/api/cron/cleanup-idempotency-cache` | GET | ✅ Live | Idempotency cache cleanup cron |
| `/api/cron/cleanup-stale-bookings` | GET | ✅ Live | Stale booking cleanup cron |

### Platform API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/health` | GET | ✅ Live | Platform health check |
| `/api/properties` | GET | ✅ Live | List properties with filters |
| `/api/destinations` | GET | ✅ Live | List corridor destinations |
| `/api/search` | GET | ✅ Live | Full-text search |
| `/api/inquiries` | GET/POST | ✅ Live | Submit & retrieve inquiries |
| `/api/transactions` | GET/POST | ✅ Live | Payment & escrow flow (Paystack) |
| `/api/agent/stats` | GET | ✅ Live | Agent dashboard metrics |
| `/api/agent/listings` | GET/POST | ✅ Live | Agent listings management |
| `/api/agent/inquiries` | GET | ✅ Live | Agent inquiry inbox |
| `/api/admin/stats` | GET | ✅ Live | Platform overview stats |
| `/api/kyc/verify` | POST | ⚠️ Ready | KYC verification request |
| `/api/webhooks/paystack` | POST | ✅ Live | Paystack payment confirmations |
| `/api/webhooks/stripe-cc` | POST | ⚠️ Ready | Stripe CC payment confirmations |
| `/api/webhooks/kyc` | POST | ⚠️ Ready | KYC verification results |

---

## 📄 Platform Pages

| Page | URL | Status |
|------|-----|--------|
| Homepage | https://coastalcorridor.africa/ | ✅ Live |
| Properties | https://coastalcorridor.africa/properties | ✅ Live |
| Property Detail | https://coastalcorridor.africa/properties/[slug] | ✅ Live |
| Destinations | https://coastalcorridor.africa/destinations | ✅ Live |
| Destination Detail | https://coastalcorridor.africa/destinations/[slug] | ✅ Live |
| Agents | https://coastalcorridor.africa/agents | ✅ Live |
| Map (3D/2D) | https://coastalcorridor.africa/map | ✅ Live |
| Account | https://coastalcorridor.africa/account | ✅ Live |
| Agent Dashboard | https://agent.coastalcorridor.africa/agent/dashboard | ✅ Live |
| Admin Console | https://admin.coastalcorridor.africa/admin/dashboard | ✅ Live |

---

## 🔑 Environment Variables (Vercel)

| Variable | Status | Service |
|----------|--------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Set | Clerk (Production) |
| `CLERK_SECRET_KEY` | ✅ Set | Clerk (Production) |
| `DATABASE_URL` | ✅ Set | Supabase PostgreSQL |
| `POSTMARK_API_TOKEN` | ✅ Set | Postmark Email |
| `PAYSTACK_SECRET_KEY` | ✅ Set | Paystack (Production) |
| `PAYSTACK_WEBHOOK_SECRET` | ✅ Set | Paystack Webhooks |
| `OWAMBE_API_BASE_URL` | ✅ Set | Owambe Channel API |
| `OWAMBE_HMAC_SECRET` | ✅ Set | Owambe HMAC signing |
| `CRON_SECRET` | ✅ Set | Cron route auth guard |
| `STRIPE_SECRET_KEY` | ⚠️ Test only | Stripe CC Payments |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Pending | Stripe CC Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ Test only | Stripe CC (Client) |
| `SMILE_IDENTITY_API_KEY` | ❌ Not set | Smile Identity KYC |
| `SMILE_IDENTITY_PARTNER_ID` | ❌ Not set | Smile Identity KYC |

---

## 📁 Repository

| Item | Details |
|------|---------|
| **GitHub Repo** | https://github.com/mottainaisurvey/coastal-corridor |
| **Visibility** | Private |
| **Branch** | main |
| **Vercel Auto-Deploy** | ✅ Connected — main branch → coastal-corridor-staging |
| **Latest commit** | `72efe93` — feat(stays): CC-STAYS-RESERVATION-SENDER-01 |

---

## 🔒 Security Status

| Check | Status |
|-------|--------|
| HTTPS enforced | ✅ |
| Environment variables secured | ✅ |
| API keys not hardcoded | ✅ |
| Webhook HMAC signature verification (inbound) | ✅ |
| Outbound HMAC signing (callOwambe) | ✅ |
| Cron route CRON_SECRET guard | ✅ |
| Input validation on all endpoints | ✅ |
| Database connection encrypted | ✅ |
| CORS configured | ✅ |
| Rate limiting (framework) | ✅ |
| Audit logging (critical paths) | ✅ |
| Idempotency cache (outbound + inbound) | ✅ |

---

## 📊 Monitoring

| Service | URL | Status |
|---------|-----|--------|
| Vercel Dashboard | https://vercel.com/owambe/coastal-corridor | ✅ Active |
| Vercel Analytics | https://vercel.com/owambe/coastal-corridor/analytics | ✅ Active |
| Vercel Logs | https://vercel.com/owambe/coastal-corridor/logs | ✅ Active |
| Supabase Dashboard | https://zpgdjffavjtccyjfshnu.supabase.co | ✅ Active |
| Clerk Dashboard | https://dashboard.clerk.com | ✅ Active |
| Postmark Dashboard | https://account.postmarkapp.com | ✅ Active |
| Status Page | https://status.coastalcorridor.africa | ⚠️ Not yet configured |

---

## 🗓️ Phase Completion Record

### Phase 5.1 — Owambe Channel Integration (CLOSED May 23, 2026)

| Brief | Commit | Description |
|---|---|---|
| CC-WEBHOOK-HANDLERS-01 | `fa09e0e` | Scope A dispatch: `reservation.checked_in`, `reservation.checked_out`, `reservation.status_changed` added to inbound webhook dispatcher |
| CC-STAYS-RESERVATION-SENDER-01 | `72efe93` | Outbound stays-reservation dispatcher: `sync-stays-reservation.ts`, Prisma migration, cron route, 21 unit tests (all PASS) |

### Phase 5.2 — Pending

- CC outbound stays-reservation sender brief (Phase 5.2 trigger item) — authoring pending

---

## 🗓️ Roadmap

### Immediate
- [x] Phase 5.1 Owambe channel integration — CLOSED
- [ ] Phase 5.2 authoring sequence initiation
- [ ] Verify Postmark sender domain (`mail.coastalcorridor.africa`)
- [ ] Add Stripe live keys to Vercel

### Short-Term (2 Weeks)
- [ ] Activate Smile Identity KYC
- [ ] Upload Matterport virtual tours
- [ ] Set up Betterstack at `status.coastalcorridor.africa`
- [ ] Deploy API docs at `docs.coastalcorridor.africa`
- [ ] Configure Cloudflare CDN at `cdn.coastalcorridor.africa`

### Medium-Term (1 Month)
- [x] Add Google/Apple OAuth via Clerk
- [x] Paystack live payment integration
- [x] Owambe bidirectional channel integration
- [ ] Build developer dashboard
- [ ] Property listing submission workflow
- [ ] Advanced analytics

### Long-Term (Q2–Q3)
- [ ] Live Parcel Fabric integration
- [ ] State registry API integrations
- [ ] VR build (Unity, separate repo)
- [ ] Mobile app (React Native/Expo)
- [ ] Multi-language support (Yoruba, Igbo, Hausa)

---

*This document is the single source of truth for all platform integrations. Update after every significant change.*

# Integration Status — Coastal Corridor Platform

**Last Updated**: May 28, 2026
**Platform Status**: ✅ **PRODUCTION LIVE**
**Version**: MVP v0.4 — Phase 5.2 complete
**Repository**: https://github.com/mottainaisurvey/coastal-corridor (private)
**Latest Commit**: `86fadfe` — feat(marketing): CC-COHORT-OFFER-SURFACES-CC-01 cohort bundle section on /for-operators

---

## 📊 Executive Summary

| Component | Status | Health | Last Verified |
|-----------|--------|--------|----------------|
| **Platform** | ✅ Live | Operational | May 23, 2026 |
| **Domain** | ✅ coastalcorridor.africa | Active | April 19, 2026 |
| **Database** | ✅ Connected | Operational | May 23, 2026 |
| **Authentication — Clerk** | ✅ Active | Production | May 2026 |
| **Email — Postmark** | ✅ Active | Operational | April 19, 2026 |
| **Payments — Paystack** | ✅ Live | Production | May 2026 |
| **Payments — Stripe CC** | ⚠️ Ready | Test Mode | May 2026 |
| **KYC — Smile Identity** | ⚠️ Ready | Framework | April 19, 2026 |
| **Virtual Tours — Matterport** | ⚠️ Ready | Framework | April 19, 2026 |
| **Owambe Channel Integration** | ✅ Phase 5.2 Complete | Bidirectional + Booking Events | May 28, 2026 |
| **Email Domain** | ✅ Migrated | `.africa` (all refs updated) | May 28, 2026 |
| **Cohort Offer Surfaces** | ✅ Live | `/for-operators` cohort bundle section | May 28, 2026 |
| **Mobile App — Expo** | ⚠️ Scaffolded | EAS Build Config | April 24, 2026 |
| **Analytics — PostHog** | ✅ Active | Instrumented | May 2026 |
| **Error Tracking — Sentry** | ✅ Active | Instrumented | May 2026 |
| **Storage — Supabase Storage** | ✅ Active | Documents + Images | May 2026 |

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
- **Staging Dashboard**: https://vercel.com/owambe/coastal-corridor-staging
- **GitHub Auto-Deploy**: ✅ Connected — mottainaisurvey/coastal-corridor → main branch
- **Deployments**: https://vercel.com/owambe/coastal-corridor/deployments
- **Staging Deployments**: https://vercel.com/owambe/coastal-corridor-staging/deployments
- **Environment Variables**: https://vercel.com/owambe/coastal-corridor/settings/environment-variables
- **Region**: Global CDN
- **Build Command**: `prisma generate && next build`
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
| Clerk Webhook | ✅ Active | `/api/webhooks/clerk` — user lifecycle events |
| Role-based access | ✅ Active | `publicMetadata.role` claim; middleware-enforced RBAC |
| Post-sign-in redirect | ✅ Active | `/sign-in-complete` → role-based dashboard routing |

**User Roles (UserRole enum)**:

| Role | Dashboard Route | Notes |
|---|---|---|
| `BUYER` | `/account` | Default consumer role |
| `AGENT` | `/agent/dashboard` | Real estate agents |
| `DEVELOPER` | `/developer/dashboard` | Property developers |
| `HOST` | `/host/dashboard` | Stays property hosts |
| `OPERATOR` | `/operator/dashboard` | Experience operators |
| `TOUR_OPERATOR` | `/traveller/dashboard` | Tourism operators |
| `ADMIN` | `/admin/dashboard` | Platform admins |
| `SUPERADMIN` | `/admin/dashboard` | Full platform access |
| `GOVERNMENT` | — | Registry/government access |
| `VERIFIER` | — | Title verification access |

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

### Prisma Schema Models (39 total)

| Model | Purpose |
|---|---|
| `Config` | Platform-wide configuration key/value store |
| `User` | Core user identity (Clerk-linked); includes `paystackCustomerCode`, `owambeGuestId`, `owambeHostId`, `kycStatus` |
| `Profile` | Public user profile |
| `AgentProfile` | Agent-specific profile data |
| `DeveloperProfile` | Developer-specific profile data |
| `HostProfile` | Host profile; includes `commissionRate` (`@default(0.15)`), `cohortType`, `owambeHostId` |
| `OperatorProfile` | Operator profile; includes `commissionRate`, `cohortType`, `owambeOperatorId` |
| `Destination` | Corridor destination (e.g. Lekki, Epe) |
| `DestinationStat` | Statistical data per destination |
| `PointOfInterest` | POI linked to destinations |
| `Plot` | Land plot (geospatial) |
| `RealEstateProperty` | Property listing |
| `Project` | Developer project |
| `Listing` | Agent listing |
| `SavedPlot` | Buyer-saved plots |
| `Inquiry` | Buyer inquiry on a listing |
| `Transaction` | Payment transaction (escrow) |
| `Payment` | Individual payment record |
| `PlotVerification` | Title/boundary verification |
| `TourismListing` | Tourism product listing |
| `FractionalScheme` | Fractional ownership scheme |
| `FractionalShare` | Individual fractional share |
| `RegistryRecord` | State registry record |
| `OperatorApplication` | Operator onboarding application |
| `StayProperty` | Owambe-sourced stay property |
| `Room` | Room within a StayProperty |
| `CalendarEntry` | Room availability calendar |
| `Reservation` | Guest reservation; includes `owambeSyncAttempts`, `owambeSyncError`, `outboundIdempotencyKey` |
| `StayPropertyImage` | Images for stay properties |
| `Experience` | Owambe-sourced experience |
| `TimeSlot` | Available time slot for an experience |
| `ExperienceBooking` | Guest booking for an experience; includes `owambeSyncAttempts`, `owambeSyncError` |
| `ExperienceImage` | Images for experiences |
| `BookingDraft` | Pre-payment booking draft (session-token-linked) |
| `CohortCode` | Cohort onboarding code for hosts/operators |
| `IdempotencyCache` | Idempotency key/response cache |
| `WebhookDelivery` | Inbound webhook delivery log |
| `ReconciliationLog` | Reconciliation event log |
| `AuditEntry` | Audit trail for critical operations |

### Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20260505000000_init` | May 5, 2026 | Initial schema — all core models, enums, Phase A infrastructure |
| `20260512000000_expand_payment_status` | May 12, 2026 | Added `DEPOSIT_PAID` and `PARTIALLY_REFUNDED` to `PaymentStatus` enum |
| `20260514120000_wave4_operator_experience_booking` | May 14, 2026 | Wave 4: Operator surface, experience booking pipeline, `BookingDraft` model, Owambe sync fields on `ExperienceBooking` |
| `20260514130000_add_booking_draft_completed_status` | May 14, 2026 | Added `COMPLETED` to `BookingDraftStatus` enum |
| `20260516000000_add_experience_booking_pending_abandoned` | May 16, 2026 | Added `PENDING_PAYMENT` and `ABANDONED` to `ExperienceBookingStatus` enum |
| `20260516000001_remove_dead_pending_payment_from_experience_booking_status` | May 16, 2026 | Removed dead `PENDING_PAYMENT` from `ExperienceBookingStatus` (correct lifecycle: PENDING → CONFIRMED \| ABANDONED) |
| `20260522000000_add_reservation_sync_fields` | May 22, 2026 | Added `owambeSyncAttempts INT DEFAULT 0` and `owambeSyncError TEXT` to `Reservation` (outbox pattern, CC-STAYS-RESERVATION-SENDER-01) |

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
- **Adapter**: `src/lib/paystack-adapter.ts` — `PaystackAdapter` class (CC-C-01)

| Method | Description | Status |
|---|---|---|
| `initializeTransaction()` | Create payment URL for guest checkout | ✅ Active |
| `verifyTransaction()` | Verify payment after Paystack redirect | ✅ Active |
| `refundTransaction()` | Issue refund (used in 409 Conflict path) | ✅ Active |
| `createSubaccount()` | Create Paystack subaccount for host commission splits | ✅ Active |
| `updateSubaccount()` | Update subaccount details | ✅ Active |
| `calculateCommissionSplit()` | Utility: compute host net + CC commission | ✅ Active |

| Item | Status |
|------|--------|
| Webhook handler (`/api/webhooks/paystack`) | ✅ Live |
| HMAC signature verification | ✅ Active |
| Refund flow | ✅ Active |
| Live keys | ✅ Set in Vercel |

---

## 💳 Payments — Stripe (CC Channel)

- **Status**: ⚠️ **TEST MODE — NOT LIVE**
- **Adapter**: `src/lib/stripe-adapter.ts` — `StripeAdapter` class (CC-C-02)

| Method | Description | Status |
|---|---|---|
| `createPaymentIntent()` | Create Stripe PaymentIntent | ✅ Built |
| `confirmPaymentIntent()` | Confirm PaymentIntent | ✅ Built |
| `refundTransaction()` | Issue Stripe refund | ✅ Built |

| Item | Status |
|------|--------|
| Stripe CC webhook handler (`/api/webhooks/stripe-cc`) | ✅ Built |
| HMAC/signature verification | ✅ Built |
| Live keys | ❌ Not configured |

**To Activate**: Add `STRIPE_SECRET_KEY=sk_live_...` and `STRIPE_WEBHOOK_SECRET=whsec_...` to Vercel.

---

## 💰 Commission Engine

- **File**: `src/lib/commission.ts` — `CommissionCalculator` class (CC-C-07)
- **Contract reference**: Section 13 of the Owambe API contract

### Commission Rates

| Vertical | Rate Type | Rate |
|---|---|---|
| Stays | Cohort host | **12%** |
| Stays | Standard host | **15%** |
| Experiences | Cohort operator | **15%** |
| Experiences | Standard operator | **18%** |

### Priority Order (enforced by CommissionCalculator)

1. **Cohort flag** — if `HostProfile.cohortType` is set, cohort rate applies unconditionally
2. **Negotiated rate** — `HostProfile.commissionRate` or `OperatorProfile.commissionRate` (non-cohort only)
3. **Default rate** — `COMMISSION_RATES.STAYS.STANDARD` or `COMMISSION_RATES.EXPERIENCES.STANDARD`

The cohort flag check is always first to prevent the negotiated-rate path from overriding cohort pricing for hosts onboarded via cohort codes. `HostProfile.commissionRate` has `@default(0.15)` and is non-nullable, which means the negotiated-rate path would silently apply the wrong rate without the cohort guard.

---

## 🪪 KYC — Smile Identity

- **Status**: ⚠️ **FRAMEWORK READY — NOT LIVE**
- **Adapter**: `src/lib/smile-identity-adapter.ts` — `SmileIdentityAdapter` class (CC-C-05)
- **Service**: Nigerian identity verification (BVN, NIN, liveness detection)

| Method | Description | Status |
|---|---|---|
| `initiateKYC()` | Start KYC verification session | ✅ Built |

| Item | Status |
|------|--------|
| KYC service (`/src/lib/kyc.ts`) | ✅ Built |
| Verification API (`/api/kyc/verify`) | ✅ Built |
| KYC callback (`/api/kyc/callback`) | ✅ Built |
| Webhook handler (`/api/webhooks/kyc`) | ✅ Built |
| API credentials | ❌ Not configured |

**To Activate**: Sign up at https://usesmileid.com → Get API key → Add `SMILE_IDENTITY_API_KEY` and `SMILE_IDENTITY_PARTNER_ID` to Vercel.

---

## 🏠 Virtual Tours — Matterport

- **Status**: ⚠️ **FRAMEWORK READY — NOT LIVE**

| Item | Status |
|------|--------|
| Tour embed component (`/src/components/matterport-tour.tsx`) | ✅ Built |
| Tour buttons on property pages | ✅ Present |
| Matterport account | ❌ Not configured |
| Tour URLs linked to properties | ❌ Not linked |

**To Activate**: Upload tours at https://matterport.com → Get embed URLs → Update property records in database.

---

## 📊 Analytics & Monitoring

### PostHog

- **File**: `src/lib/analytics.ts` + `src/components/PostHogProvider.tsx`
- **Status**: ✅ **ACTIVE** — Phase A instrumentation
- **Coverage**: Page views, user events, funnel tracking

### Sentry

- **Package**: `@sentry/nextjs`
- **File**: `src/instrumentation.ts`
- **Status**: ✅ **ACTIVE**
- **Coverage**: Error tracking, performance monitoring

---

## 🗃️ Storage — Supabase Storage

- **File**: `src/lib/storage.ts`
- **Status**: ✅ **ACTIVE**
- **Buckets**: `S3_BUCKET_DOCUMENTS` (title deeds, contracts), `S3_BUCKET_IMAGES` (property images)

---

## 🔗 Owambe Channel Integration

- **Status**: ✅ **Phase 5.1 COMPLETE — Bidirectional**
- **Direction**: CC → Owambe (outbound) + Owambe → CC (inbound webhooks)
- **Contract references**: §07 STAYS RESERVATIONS INBOUND, Amendment 008 (snake_case wire convention)

### Inbound (Owambe → CC)

The inbound webhook dispatcher at `/api/v1/channel/webhooks/inbound` handles the following event types. All events are verified via HMAC-SHA256 before dispatch.

| Event Type | Handler | Added | Status |
|---|---|---|---|
| `reservation.cancelled` | `handleReservationCancelled()` | Phase A | ✅ Active |
| `reservation.no_show` | `handleReservationNoShow()` | Phase A | ✅ Active |
| `reservation.guest_checked_in` | `handleReservationGuestCheckedIn()` | Phase A | ✅ Active |
| `reservation.guest_checked_out` | `handleReservationGuestCheckedOut()` | Phase A | ✅ Active |
| `reservation.refunded` | `handleReservationRefunded()` | Phase A | ✅ Active |
| `reservation.confirmed` | `handleReservationConfirmed()` | Phase B | ✅ Active |
| `booking.cancelled` | `handleBookingCancelled()` | Phase B | ✅ Active |
| `booking.no_show` | `handleBookingNoShow()` | Phase B | ✅ Active |
| `booking.completed` | `handleBookingCompleted()` | Phase B | ✅ Active |
| `booking.refunded` | `handleBookingRefunded()` | Phase B | ✅ Active |
| `booking.confirmed` | `handleBookingConfirmed()` | Phase B | ✅ Active |
| `property.deactivated` | `handlePropertyDeactivated()` | Phase B | ✅ Active |
| `property.updated` | `handlePropertyUpdated()` | Phase B | ✅ Active |
| `experience.deactivated` | `handleExperienceDeactivated()` | Phase B | ✅ Active |
| `experience.updated` | `handleExperienceUpdated()` | Phase B | ✅ Active |
| `availability.updated` | `handleAvailabilityUpdated()` | Phase B | ✅ Active |
| `reconciliation.requested` | `handleReconciliationRequested()` | Phase B | ✅ Active |
| `reservation.checked_in` | `handleReservationGuestCheckedIn()` (alias) | `fa09e0e` | ✅ Active — CC-WEBHOOK-HANDLERS-01 |
| `reservation.checked_out` | `handleReservationGuestCheckedOut()` (alias) | `fa09e0e` | ✅ Active — CC-WEBHOOK-HANDLERS-01 |
| `reservation.status_changed` | `handleReservationStatusChanged()` | `fa09e0e` | ✅ Active — CC-WEBHOOK-HANDLERS-01 |

### Outbound (CC → Owambe)

| Feature | File | Commit | Status |
|---|---|---|---|
| Stays reservation sender dispatcher | `src/lib/sync-stays-reservation.ts` | `72efe93` | ✅ Active — CC-STAYS-RESERVATION-SENDER-01 |
| Stays reservation cron (every 5 min) | `src/app/api/cron/sync-stays-reservations/route.ts` | `72efe93` | ✅ Active |
| Experience booking sender | `src/lib/sync-experience-booking.ts` | Wave 4 | ✅ Active |
| Experience booking cron (every 5 min) | `src/app/api/cron/sync-owambe-bookings/route.ts` | Wave 4 | ✅ Active |
| Reconciliation cron (every 6 hrs) | `src/app/api/cron/reconcile-owambe/route.ts` | Phase B | ✅ Active |

### Channel Adapter — Path Constants (`src/lib/coastal-corridor.adapter.ts`)

| Constant | Value | Status |
|---|---|---|
| `OWAMBE_RESERVATION_POST_PATH` | `/api/v1/channel/stays/reservations` | ✅ Active — wired in `sync-stays-reservation.ts` |
| `OWAMBE_RESERVATION_PATCH_PATH` | `/api/v1/channel/stays/reservations/:id` | ✅ Active |
| `OWAMBE_EXPERIENCE_BOOKING_POST_PATH` | `/api/v1/channel/experiences/bookings` | ✅ Active |

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
| `cleanup-stale-bookings` | `30 3 * * *` | Stale booking cleanup (PENDING → ABANDONED after TTL) |

---

## 📱 Mobile App — Expo React Native

- **Status**: ⚠️ **SCAFFOLDED — EAS Build Config Ready**
- **Directory**: `/mobile`
- **Bundle ID (iOS)**: `africa.coastalcorridor.app`
- **App Store Connect App ID**: `6763654743`
- **Apple Team ID**: `77P97UVCSF`
- **Expo Account**: owambeeventflow (ID: `029072c2`)
- **EAS Build**: ✅ Configured (development / preview / production profiles)

### Mobile Screens

| Screen | Route | Status |
|---|---|---|
| Onboarding carousel | `/(onboarding)/index` | ✅ Built |
| Sign In | `/(auth)/sign-in` | ✅ Built |
| Sign Up | `/(auth)/sign-up` | ✅ Built |
| Forgot Password | `/(auth)/forgot-password` | ✅ Built |
| Home | `/(tabs)/index` | ✅ Built |
| Properties | `/(tabs)/properties` | ✅ Built |
| Fractional | `/(tabs)/fractional` | ✅ Built |
| Account | `/(tabs)/account` | ✅ Built |
| Property Detail | `/property/[slug]` | ✅ Built |
| KYC | `/kyc/index` | ✅ Built |
| Privacy | `/(legal)/privacy` | ✅ Built |
| Terms | `/(legal)/terms` | ✅ Built |
| SSO Callback | `/sso-callback` | ✅ Built |

### Mobile Dependencies

`@clerk/clerk-expo`, `expo-router`, `expo-secure-store`, `expo-local-authentication`, `expo-auth-session`, `expo-crypto`, `react-native-webview`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-screens`

---

## 📱 API Routes

### Channel API (Owambe Integration)

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/v1/channel/webhooks/inbound` | POST | ✅ Live | Inbound Owambe webhook dispatcher (20 event types) |
| `/api/v1/channel/stays/reservations` | POST | ✅ Live | Outbound stays reservation (callOwambe target) |
| `/api/v1/channel/stays/properties` | POST | ✅ Live | Register Owambe stay property |
| `/api/v1/channel/stays/properties/[id]` | PATCH/DELETE | ✅ Live | Update/deactivate stay property |
| `/api/v1/channel/stays/properties/[id]/availability` | PUT | ✅ Live | Update room availability |
| `/api/v1/channel/experiences/inventory` | POST | ✅ Live | Register Owambe experience |
| `/api/v1/channel/experiences/[id]/time-slots` | PUT | ✅ Live | Update experience time slots |
| `/api/v1/channel/experiences/bookings` | POST | ✅ Live | Outbound experience booking |
| `/api/v1/channel/reconciliation/stays/snapshot` | GET | ✅ Live | Stays inventory snapshot for reconciliation |
| `/api/v1/channel/reconciliation/experiences/snapshot` | GET | ✅ Live | Experiences inventory snapshot for reconciliation |

### Cron Routes

| Route | Method | Schedule | Status |
|-------|--------|----------|--------|
| `/api/cron/sync-owambe-bookings` | GET | `*/5 * * * *` | ✅ Live |
| `/api/cron/sync-stays-reservations` | GET | `*/5 * * * *` | ✅ Live |
| `/api/cron/reconcile-owambe` | GET | `0 */6 * * *` | ✅ Live |
| `/api/cron/cleanup-idempotency-cache` | GET | `0 3 * * *` | ✅ Live |
| `/api/cron/cleanup-stale-bookings` | GET | `30 3 * * *` | ✅ Live |

### Webhook Routes

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/webhooks/paystack` | POST | ✅ Live | Paystack payment confirmations |
| `/api/webhooks/clerk` | POST | ✅ Live | Clerk user lifecycle events |
| `/api/webhooks/stripe-cc` | POST | ⚠️ Ready | Stripe CC payment confirmations |
| `/api/webhooks/kyc` | POST | ⚠️ Ready | KYC verification results |
| `/api/webhooks/owambe` | POST | ✅ Live | Legacy Owambe webhook (pre-v1 channel) |

### Platform API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/health` | GET | ✅ Live | Platform health check |
| `/api/properties` | GET | ✅ Live | List properties with filters |
| `/api/properties/[slug]` | GET | ✅ Live | Property detail |
| `/api/destinations` | GET | ✅ Live | List corridor destinations |
| `/api/search` | GET | ✅ Live | Full-text search |
| `/api/inquiries` | GET/POST | ✅ Live | Submit & retrieve inquiries |
| `/api/transactions` | GET/POST | ✅ Live | Payment & escrow flow (Paystack) |
| `/api/escrow/[transactionId]` | GET | ✅ Live | Escrow state machine |
| `/api/map` | GET | ✅ Live | Map data endpoint |
| `/api/documents` | GET/POST | ✅ Live | Document management |

### Agent API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/agent/stats` | GET | ✅ Live | Agent dashboard metrics |
| `/api/agent/listings` | GET/POST | ✅ Live | Agent listings management |
| `/api/agent/inquiries` | GET | ✅ Live | Agent inquiry inbox |
| `/api/agent/profile` | GET/PATCH | ✅ Live | Agent profile management |

### Host API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/host/stats` | GET | ✅ Live | Host dashboard metrics |
| `/api/host/properties` | GET | ✅ Live | Host property list |
| `/api/host/bookings` | GET | ✅ Live | Host booking list |
| `/api/host/revenue` | GET | ✅ Live | Host revenue summary |
| `/api/host/settings` | GET/PATCH | ✅ Live | Host settings |
| `/api/host/provision` | POST | ✅ Live | Host onboarding provisioning |

### Operator API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/operator/stats` | GET | ✅ Live | Operator dashboard metrics |
| `/api/operator/experiences` | GET | ✅ Live | Operator experience list |
| `/api/operator/bookings` | GET | ✅ Live | Operator booking list |
| `/api/operator/revenue` | GET | ✅ Live | Operator revenue summary |
| `/api/operator/settings` | GET/PATCH | ✅ Live | Operator settings |
| `/api/operator/provision` | POST | ✅ Live | Operator onboarding provisioning |
| `/api/operators/apply` | POST | ✅ Live | Operator application submission |

### Admin API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/admin/stats` | GET | ✅ Live | Platform overview stats |
| `/api/admin/users` | GET | ✅ Live | User list |
| `/api/admin/users/[id]/role` | PATCH | ✅ Live | Update user role |
| `/api/admin/listings` | GET | ✅ Live | All listings |
| `/api/admin/transactions` | GET | ✅ Live | All transactions |
| `/api/admin/disputes` | GET | ✅ Live | Dispute management |
| `/api/admin/audit` | GET | ✅ Live | Audit log |
| `/api/admin/config` | GET/PATCH | ✅ Live | Platform config |
| `/api/admin/host-applications` | GET | ✅ Live | Host application list |
| `/api/admin/host-applications/[id]/approve` | POST | ✅ Live | Approve host application |
| `/api/admin/host-applications/[id]/reject` | POST | ✅ Live | Reject host application |
| `/api/admin/verification` | GET | ✅ Live | Verification management |

### Booking API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/bookings/draft` | POST | ✅ Live | Create booking draft |
| `/api/bookings/draft/[id]` | GET/PATCH | ✅ Live | Manage booking draft |
| `/api/bookings/draft/[id]/proceed-to-payment` | POST | ✅ Live | Initiate payment for draft |
| `/api/bookings/[bookingId]/confirmation` | GET | ✅ Live | Booking confirmation |
| `/api/experiences` | GET | ✅ Live | List experiences |
| `/api/experiences/[id]` | GET | ✅ Live | Experience detail |
| `/api/experiences/checkout/[experienceBookingId]` | GET | ✅ Live | Experience checkout |

### KYC & Fractional API

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/kyc/verify` | POST | ⚠️ Ready | KYC verification request |
| `/api/kyc/callback` | POST | ⚠️ Ready | KYC callback |
| `/api/fractional/schemes` | GET | ✅ Live | Fractional schemes list |
| `/api/fractional/purchase` | POST | ✅ Live | Purchase fractional share |
| `/api/fractional/portfolio` | GET | ✅ Live | Buyer fractional portfolio |

### Diagnostic API (Staging Only)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/diagnostic/db-info` | GET | Database connection info |
| `/api/diagnostic/audit-log` | GET | Recent audit entries |
| `/api/diagnostic/booking-state/[id]` | GET | Booking state inspection |
| `/api/diagnostic/experience/[id]` | GET | Experience DB state |
| `/api/diagnostic/cohort-hosts` | GET | Cohort host list |
| `/api/diagnostic/seed-*` | POST | Seed data endpoints |

---

## 📄 Platform Pages (85 total)

### Consumer Pages

| Page | URL | Status |
|------|-----|--------|
| Homepage | / | ✅ Live |
| Properties | /properties | ✅ Live |
| Property Detail | /properties/[slug] | ✅ Live |
| Destinations | /destinations | ✅ Live |
| Destination Detail | /destinations/[slug] | ✅ Live |
| Experiences | /experiences | ✅ Live |
| Experience Detail | /experiences/[id] | ✅ Live |
| Experience Booking | /experiences/[id]/book | ✅ Live |
| Experience Checkout | /experiences/checkout/[id] | ✅ Live |
| Map (3D/2D) | /map | ✅ Live |
| Agents | /agents | ✅ Live |
| Fractional | /fractional | ✅ Live |
| Invest | /invest | ✅ Live |
| Tourism | /tourism | ✅ Live |

### Account Pages

| Page | URL | Status |
|------|-----|--------|
| Account | /account | ✅ Live |
| Transactions | /account/transactions | ✅ Live |
| Transaction Detail | /account/transactions/[id] | ✅ Live |
| Documents | /account/documents | ✅ Live |
| KYC | /account/kyc | ✅ Live |
| Portfolio | /account/portfolio | ✅ Live |
| Saved | /account/saved | ✅ Live |
| Inquiries | /account/inquiries | ✅ Live |

### Role Dashboards

| Dashboard | URL | Status |
|-----------|-----|--------|
| Agent Dashboard | /agent/dashboard | ✅ Live |
| Agent Listings | /agent/listings | ✅ Live |
| Agent Inquiries | /agent/inquiries | ✅ Live |
| Agent Profile | /agent/profile | ✅ Live |
| Host Dashboard | /host/dashboard | ✅ Live |
| Host Properties | /host/properties | ✅ Live |
| Host Bookings | /host/bookings | ✅ Live |
| Host Revenue | /host/revenue | ✅ Live |
| Host Settings | /host/settings | ✅ Live |
| Operator Dashboard | /operator/dashboard | ✅ Live |
| Operator Experiences | /operator/experiences | ✅ Live |
| Operator Bookings | /operator/bookings | ✅ Live |
| Operator Revenue | /operator/revenue | ✅ Live |
| Operator Settings | /operator/settings | ✅ Live |
| Developer Dashboard | /developer/dashboard | ✅ Live |
| Developer Projects | /developer/projects | ✅ Live |
| Developer Profile | /developer/profile | ✅ Live |
| Traveller Dashboard | /traveller/dashboard | ✅ Live |
| Investor Dashboard | /investor/dashboard | ✅ Live |
| Admin Dashboard | /admin/dashboard | ✅ Live |
| Admin Users | /admin/users | ✅ Live |
| Admin Listings | /admin/listings | ✅ Live |
| Admin Transactions | /admin/transactions | ✅ Live |
| Admin Disputes | /admin/disputes | ✅ Live |
| Admin Audit | /admin/audit | ✅ Live |
| Admin Config | /admin/config | ✅ Live |
| Admin Analytics | /admin/analytics | ✅ Live |
| Admin Roles | /admin/roles | ✅ Live |
| Admin Host Applications | /admin/host-applications | ✅ Live |
| Admin Integrations | /admin/integrations | ✅ Live |
| Admin Verification | /admin/verification | ✅ Live |

### Content Pages (12)

About, Careers, Contact, Cookies, Diaspora, For Agents, For Developers, For Operators, Fractional, Legal, Press, Privacy, Professional, Terms — all ✅ Live

---

## 🧪 Test Suite

**Total tests**: 240 across 14 test files (all passing)

| Test File | Tests | Coverage |
|-----------|-------|---------|
| `src/app/api/v1/channel/__tests__/cc-c-07.test.ts` | 30 | CommissionCalculator — all rate paths, cohort guard, integer arithmetic |
| `src/app/api/v1/channel/__tests__/phase-b.test.ts` | 34 | Phase B channel endpoints — property registration, availability, experience inventory |
| `src/app/api/webhooks/__tests__/owambe-cc-c-06.test.ts` | 20 | Owambe inbound webhook business logic — CC-C-06 |
| `src/app/api/webhooks/__tests__/owambe.test.ts` | 7 | Legacy Owambe webhook handler |
| `src/app/api/webhooks/stripe-cc/__tests__/stripe-cc-webhook.test.ts` | 7 | Stripe CC webhook handler |
| `src/lib/__tests__/commission.test.ts` | 24 | CommissionCalculator unit tests |
| `src/lib/__tests__/hmac.test.ts` | 17 | HMAC signing and verification |
| `src/lib/__tests__/idempotency.test.ts` | 8 | Idempotency cache read/write/hit/miss |
| `src/lib/__tests__/paystack-adapter.test.ts` | 29 | PaystackAdapter — all methods, error paths |
| `src/lib/__tests__/paystack.test.ts` | 14 | Paystack SDK wrapper |
| `src/lib/__tests__/smile-identity-adapter.test.ts` | 18 | SmileIdentityAdapter — KYC initiation, sandbox/live modes |
| `src/lib/__tests__/stripe-adapter.test.ts` | 11 | StripeAdapter — PaymentIntent, refund |
| `src/lib/__tests__/sync-stays-reservation.test.ts` | 21 | Stays reservation outbox — 201, 409, retry, idempotency, dead-letter |
| `src/middleware.test.ts` | 0 | Middleware smoke tests |

---

## 🔑 Environment Variables (Vercel)

| Variable | Status | Service |
|----------|--------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Set | Clerk (Production) |
| `CLERK_SECRET_KEY` | ✅ Set | Clerk (Production) |
| `DATABASE_URL` | ✅ Set | Supabase PostgreSQL |
| `POSTMARK_API_TOKEN` | ✅ Set | Postmark Email |
| `PAYSTACK_SECRET_KEY` | ✅ Set | Paystack (Production) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | ✅ Set | Paystack (Client) |
| `PAYSTACK_WEBHOOK_SECRET` | ✅ Set | Paystack Webhooks |
| `OWAMBE_API_BASE_URL` | ✅ Set | Owambe Channel API |
| `OWAMBE_HMAC_SECRET` | ✅ Set | Owambe HMAC signing (outbound) |
| `OWAMBE_SIGNING_SECRET` | ✅ Set | Owambe HMAC verification (inbound) |
| `OWAMBE_WEBHOOK_SECRET` | ✅ Set | Owambe webhook secret |
| `CRON_SECRET` | ✅ Set | Cron route auth guard |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | ✅ Set | Cesium 3D globe |
| `SENTRY_DSN` | ✅ Set | Sentry error tracking |
| `STRIPE_SECRET_KEY` | ⚠️ Test only | Stripe CC Payments |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Pending | Stripe CC Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ Test only | Stripe CC (Client) |
| `SMILE_IDENTITY_API_KEY` | ❌ Not set | Smile Identity KYC |
| `SMILE_IDENTITY_PARTNER_ID` | ❌ Not set | Smile Identity KYC |
| `FLUTTERWAVE_SECRET_KEY` | ❌ Not set | Flutterwave (diaspora corridors) |

---

## 📁 Repository

| Item | Details |
|------|---------|
| **GitHub Repo** | https://github.com/mottainaisurvey/coastal-corridor |
| **Visibility** | Private |
| **Branch** | main |
| **Total commits** | 100+ (April 19 – May 23, 2026) |
| **Source files** | 200+ TypeScript/TSX files |
| **Vercel Auto-Deploy** | ✅ Connected — main branch → coastal-corridor-staging |
| **Latest commit** | `b28d8b4` — docs: update INTEGRATION_STATUS.md to v0.3 |

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
| Channel route HMAC guard (`channel-auth.ts`) | ✅ |
| Input validation on all endpoints | ✅ |
| Database connection encrypted | ✅ |
| CORS configured | ✅ |
| Rate limiting (framework) | ✅ |
| Audit logging (critical paths) | ✅ |
| Idempotency cache (outbound + inbound) | ✅ |
| Payment Status Transition Guard (`payment-status-guard.ts`) | ✅ |
| Security headers (vercel.json) | ✅ X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |

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
| Sentry | https://sentry.io | ✅ Active |
| PostHog | https://posthog.com | ✅ Active |
| Status Page | https://status.coastalcorridor.africa | ⚠️ Not yet configured |

---

## 🗓️ Development Phase Record (Inception → Present)

### Pre-Integration Platform Build (April 19, 2026)

The initial platform was built as a complete Next.js 14 App Router application with Clerk authentication, Supabase PostgreSQL, Postmark email, Stripe payments, and Smile Identity KYC framework. All 12 admin and agent dashboard sub-pages were built, along with 12 content pages and the full RBAC role system. The platform went live at coastalcorridor.africa on April 19, 2026.

### Mobile App Scaffold (April 24, 2026)

The Expo React Native mobile app scaffold was added to `/mobile` with Clerk authentication, EAS build configuration, and 13 screens covering onboarding, auth, tabs, and KYC. The app was linked to the Expo account `owambeeventflow` (ID: `029072c2`) and configured for App Store Connect submission (App ID: `6763654743`).

### Phase A — Owambe Integration Infrastructure (May 4, 2026)

Initial Owambe channel integration infrastructure: HMAC signing utility, idempotency cache, inbound webhook dispatcher, initial event handlers, Phase A schema additions (8 User model fields), and staging environment setup. Commit `9836bcc`.

### Phase B — Channel Inbound Endpoints (May 5, 2026)

All inbound channel endpoints built: stays property registration, availability updates, experience inventory, time slot management, reconciliation snapshots. Commit `630d04c`.

### Wave 3 — CC-C-01 through CC-C-07 (May 10–11, 2026)

PaystackAdapter (CC-C-01), StripeAdapter (CC-C-02), SmileIdentityAdapter (CC-C-05), CommissionCalculator (CC-C-07), Owambe webhook business logic (CC-C-06). All submission reports filed. 17 HMAC tests, 29 Paystack adapter tests, 24 commission tests, 18 Smile Identity tests.

### Wave 4 — Operator Surface & Experience Booking (May 13–14, 2026)

Operator profile surface (CC-C-09), experience booking pipeline (CC-D-01-A through CC-D-01-E): BookingDraft model, Paystack checkout flow, Owambe sync outbox for experience bookings, diagnostic endpoints. Wave 4 migration applied. Commit `9ab9775`.

### Wave 5 Phase 1 — Production Readiness (May 16, 2026)

Clerk production deploy gate (CC-WAVE5-PROD-DEPLOY-01), Clerk production diff audit (CC-WAVE5-CLERK-PROD-DIFF-01), CommissionCalculator cohort flag enforcement (CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01), refund cap audit (CC-WAVE5-REFUND-CAP-AUDIT-01), cleanup-stale-bookings cron (Phase E #37), middleware cleanup, platform constants. All Phase E CC-only items closed.

### Phase 5.1 — Owambe Channel Completion (May 22–23, 2026)

| Brief | Commit | Description |
|---|---|---|
| CC-WEBHOOK-HANDLERS-01 | `fa09e0e` | Added `reservation.checked_in`, `reservation.checked_out`, `reservation.status_changed` to inbound dispatcher |
| CC-STAYS-RESERVATION-SENDER-01 | `72efe93` | Outbound stays-reservation dispatcher, Prisma migration, cron route, 21 unit tests |

---

## 🗓️ Phase E Tracker Summary

| Item | Status | Notes |
|---|---|---|
| #17 — CommissionCalculator Cohort Rate | CLOSED | Cohort flag is authoritative enforcement for 12% rate |
| #13 — Refund Cap Audit | CLOSED | No refund cap in CC codebase — pure pass-through to Stripe/Paystack |
| #37 — Cleanup Stale Bookings Cron | CLOSED | Migrations applied; cron operational; ABANDONED status live |
| #48 — Clerk Production Deploy Gate | CLOSED | Nav/auth items 01-02 deployed; smoke test passed |
| #5b — Owambe Reconciliation CC-Side | RESOLVED-NO-CC-WORK | CC role is snapshot provider only; no new endpoints required |
| #2 — OWAMBE_RESERVATION_POST_PATH | CLOSED | Wired in CC-STAYS-RESERVATION-SENDER-01 (`72efe93`) |
| #49 — Refund Cap Design Decision | DEFERRED | Revisit if operational evidence surfaces |
| #7 — Cross-thread item | HELD | Owambe Wave 4 opening |
| Wave 5 Nav/Auth items (03-09) | HELD | Pending Framing B vendor marketplace decision |
| CC-OPS-02 | HELD | Pending founder direction |

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
- [x] Operator surface + experience booking pipeline
- [x] Mobile app scaffold
- [ ] Build developer dashboard
- [ ] Property listing submission workflow
- [ ] Advanced analytics

### Long-Term (Q2–Q3)
- [ ] Live Parcel Fabric integration
- [ ] State registry API integrations
- [ ] VR build (Unity, separate repo)
- [ ] Mobile app production release (App Store + Google Play)
- [ ] Multi-language support (Yoruba, Igbo, Hausa)
- [ ] Flutterwave diaspora corridor payments

---

*This document is the single source of truth for all platform integrations. Update after every significant change.*

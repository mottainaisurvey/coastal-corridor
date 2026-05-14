/**
 * GET  /api/host/settings
 * PATCH /api/host/settings
 *
 * CC-C-08-C-2 — Host dashboard settings sub-route.
 *
 * GET returns the host's settings data structured across four sections:
 *   - profile:      name, email, phone, memberSince
 *   - verification: kycStatus, verificationLevel, documentsOnFile
 *   - payout:       accountCurrency, bankAccount (null — KYC-managed),
 *                   perPropertyBreakdown
 *   - cohort:       membershipStatus, commissionRate, termRemaining
 *
 * PATCH accepts { payoutCurrency: "NGN" | "USD" | "GBP" } and updates
 * User.preferredCurrency (the canonical payout currency field per AC-0 audit;
 * HostProfile.payoutCurrency does not exist in the current schema — Phase E item).
 *
 * AC-0 gap notes (schema pre-verification):
 *   - No KycRecord model exists; kycStatus is User.kycStatus (String?).
 *   - No bank account model exists; bankAccount returns null with a UI message.
 *   - Cohort term uses User.cohortEndDate (DateTime?); null → "Term end date not set".
 *   - Phone is User.phone (String?); null → omitted from profile section.
 *   - payoutCurrency maps to User.preferredCurrency (Currency enum: NGN/USD/GBP).
 *
 * Authentication: Clerk session — HOST role required.
 * Per-host isolation: all reads/writes filter to the authenticated host's User.id.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';

// ─── Types ────────────────────────────────────────────────────────────────────

const VALID_CURRENCIES = ['NGN', 'USD', 'GBP'] as const;
type PayoutCurrency = typeof VALID_CURRENCIES[number];

interface SettingsResponse {
  profile: {
    name: string | null;
    email: string;
    phone: string | null;
    memberSince: string; // ISO 8601
  };
  verification: {
    kycStatus: string | null;
    verificationLevel: string | null;
    documentsOnFile: string[];
  };
  payout: {
    accountCurrency: PayoutCurrency;
    bankAccount: null; // KYC-managed — not captured via settings UI
    perPropertyBreakdown: {
      propertyId: string;
      name: string;
      location: string;
      effectiveCurrency: PayoutCurrency;
    }[];
  };
  cohort: {
    membershipStatus: 'COHORT' | 'STANDARD';
    commissionRate: number; // decimal fraction e.g. 0.12
    commissionRatePct: string; // display string e.g. "12%"
    termRemaining: string | null; // ISO 8601 date or null
  };
}

// ─── Shared auth + user lookup ────────────────────────────────────────────────

async function resolveHostUser(clerkUserId: string) {
  const db = getPrismaClient();
  if (!db) return { db: null, user: null, error: 'Database unavailable' };

  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      kycStatus: true,
      cohortMember: true,
      cohortType: true,
      cohortEndDate: true,
      preferredCurrency: true,
      createdAt: true,
    },
  });

  if (!user) return { db, user: null, error: 'User record not found' };
  if (user.role !== 'HOST') return { db, user: null, error: 'Forbidden' };

  return { db, user, error: null };
}

// ─── Build settings response ──────────────────────────────────────────────────

async function buildSettingsResponse(
  db: NonNullable<ReturnType<typeof getPrismaClient>>,
  user: {
    id: string;
    email: string;
    phone: string | null;
    kycStatus: string | null;
    cohortMember: boolean;
    cohortEndDate: Date | null;
    preferredCurrency: string;
    createdAt: Date;
  }
): Promise<SettingsResponse> {
  // Fetch HostProfile
  const hostProfile = await db.hostProfile.findUnique({
    where: { userId: user.id },
    select: {
      displayName: true,
      businessName: true,
      commissionRate: true,
      verificationLevel: true,
      verifiedAt: true,
    },
  });

  // Fetch host's properties for per-property breakdown
  const properties = await db.stayProperty.findMany({
    where: { hostUserId: user.id },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // ── Profile section ──────────────────────────────────────────────────────────
  const displayName =
    hostProfile?.displayName ??
    hostProfile?.businessName ??
    null;

  // ── Verification section ─────────────────────────────────────────────────────
  // No KycRecord model exists (AC-0b). kycStatus is a freeform string on User.
  // verificationLevel is VerificationLevel? on HostProfile (BASIC/ENHANCED/PREMIUM).
  // documentsOnFile: no document model exists — empty array with graceful UI message.
  const documentsOnFile: string[] = [];
  if (hostProfile?.verifiedAt) {
    documentsOnFile.push('Identity verification: complete');
  }

  // ── Payout section ───────────────────────────────────────────────────────────
  // User.preferredCurrency is the canonical payout currency (Currency enum).
  // No bank account model exists (AC-0c) — bankAccount is always null.
  const accountCurrency = (user.preferredCurrency ?? 'NGN') as PayoutCurrency;

  const perPropertyBreakdown = properties.map((p) => ({
    propertyId: p.id,
    name: p.name,
    location: [p.city, p.state].filter(Boolean).join(', ') || 'Location not set',
    effectiveCurrency: accountCurrency, // defaults to account-level for v1 (no per-property override)
  }));

  // ── Cohort section ───────────────────────────────────────────────────────────
  // Cohort determination: User.cohortMember (Boolean) per CommissionCalculator.resolveRate().
  // commissionRate from HostProfile (Decimal default 0.15); falls back to cohort/standard default.
  const rawRate = hostProfile?.commissionRate
    ? Number(hostProfile.commissionRate)
    : user.cohortMember
    ? 0.12
    : 0.15;
  const commissionRatePct = `${Math.round(rawRate * 100)}%`;

  return {
    profile: {
      name: displayName,
      email: user.email,
      phone: user.phone ?? null,
      memberSince: user.createdAt.toISOString(),
    },
    verification: {
      kycStatus: user.kycStatus ?? null,
      verificationLevel: hostProfile?.verificationLevel ?? null,
      documentsOnFile,
    },
    payout: {
      accountCurrency,
      bankAccount: null,
      perPropertyBreakdown,
    },
    cohort: {
      membershipStatus: user.cohortMember ? 'COHORT' : 'STANDARD',
      commissionRate: rawRate,
      commissionRatePct,
      termRemaining: user.cohortEndDate ? user.cohortEndDate.toISOString() : null,
    },
  };
}

// ─── GET /api/host/settings ───────────────────────────────────────────────────

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { db, user, error } = await resolveHostUser(clerkUserId);
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  if (!user) {
    const status = error === 'Forbidden' ? 403 : error === 'User record not found' ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  const settings = await buildSettingsResponse(db, user);
  return NextResponse.json(settings, { status: 200 });
}

// ─── PATCH /api/host/settings ─────────────────────────────────────────────────

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { db, user, error } = await resolveHostUser(clerkUserId);
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  if (!user) {
    const status = error === 'Forbidden' ? 403 : error === 'User record not found' ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('payoutCurrency' in body)
  ) {
    return NextResponse.json(
      { error: 'Missing required field: payoutCurrency' },
      { status: 400 }
    );
  }

  const { payoutCurrency } = body as { payoutCurrency: unknown };

  if (!VALID_CURRENCIES.includes(payoutCurrency as PayoutCurrency)) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYOUT_CURRENCY',
        message: `payoutCurrency must be one of: ${VALID_CURRENCIES.join(', ')}`,
        received: payoutCurrency,
      },
      { status: 422 }
    );
  }

  // Update User.preferredCurrency (canonical payout currency field per AC-0 audit)
  await db.user.update({
    where: { id: user.id },
    data: { preferredCurrency: payoutCurrency as PayoutCurrency },
  });

  // Return the updated settings (same shape as GET)
  const updatedUser = { ...user, preferredCurrency: payoutCurrency as string };
  const settings = await buildSettingsResponse(db, updatedUser);
  return NextResponse.json(settings, { status: 200 });
}

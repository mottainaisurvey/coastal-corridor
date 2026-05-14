/**
 * GET /api/operator/settings
 * PATCH /api/operator/settings
 *
 * CC-C-09-C-2 — AC-1 & AC-2: Operator settings endpoint.
 *
 * GET: Returns the operator's settings data structured by section:
 *   - profile:      { name, email, phone, memberSince }
 *   - verification: { kycStatus, verificationLevel, documentsOnFile }
 *   - payout:       { accountCurrency, bankAccount, perExperienceBreakdown }
 *   - cohort:       { membershipStatus, commissionRate, commissionRatePct, termRemaining }
 *
 * PATCH: Accepts { payoutCurrency: "NGN" | "USD" | "GBP" }.
 *   Updates User.preferredCurrency (shared field — intentional; see AC-7b).
 *   Returns updated settings response (same shape as GET).
 *
 * Authentication: Clerk session. OPERATOR role required.
 * Per-operator isolation: reads/writes only the authenticated operator's data.
 *
 * Data sources (confirmed in AC-0):
 *   - name:              OperatorProfile.displayName ?? OperatorProfile.businessName ?? User.name
 *   - email:             User.email
 *   - phone:             User.phone (nullable)
 *   - memberSince:       User.createdAt
 *   - kycStatus:         User.kycStatus (nullable String)
 *   - verificationLevel: OperatorProfile.verificationLevel (nullable)
 *   - documentsOnFile:   [] (no schema field — degrade gracefully)
 *   - accountCurrency:   User.preferredCurrency (Currency enum, default NGN)
 *   - bankAccount:       null (no schema field — display "Managed by verification team")
 *   - perExperienceBreakdown: Experience records for this operator
 *   - cohortMember:      User.cohortMember
 *   - cohortEndDate:     User.cohortEndDate
 *   - commissionRate:    OperatorProfile.commissionRate
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';
import { getUserRoles } from '@/lib/user-roles';

const VALID_CURRENCIES = ['NGN', 'USD', 'GBP'] as const;
type ValidCurrency = typeof VALID_CURRENCIES[number];

async function buildSettingsResponse(db: NonNullable<ReturnType<typeof getPrismaClient>>, operatorUserId: string) {
  // Fetch User + OperatorProfile + Experiences in parallel
  const [user, profile, experiences] = await Promise.all([
    db.user.findUnique({
      where: { id: operatorUserId },
      select: {
        id:               true,
        name:             true,
        email:            true,
        phone:            true,
        createdAt:        true,
        kycStatus:        true,
        preferredCurrency: true,
        cohortMember:     true,
        cohortEndDate:    true,
      },
    }),
    db.operatorProfile.findUnique({
      where: { userId: operatorUserId },
      select: {
        displayName:       true,
        businessName:      true,
        commissionRate:    true,
        verificationLevel: true,
        verifiedAt:        true,
      },
    }),
    db.experience.findMany({
      where: { operatorUserId },
      select: {
        id:                      true,
        name:                    true,
        meetingPointDescription: true,
        status:                  true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!user) return null;

  // Section 1: Profile
  const operatorName =
    profile?.displayName ?? profile?.businessName ?? user.name ?? null;

  // Section 2: Verification
  const kycStatus        = user.kycStatus ?? null;
  const verificationLevel = profile?.verificationLevel ?? null;

  // Section 3: Payout
  const accountCurrency = (user.preferredCurrency as string) ?? 'NGN';
  const perExperienceBreakdown = experiences.map(exp => ({
    experienceId:      exp.id,
    name:              exp.name,
    location:          exp.meetingPointDescription,
    effectiveCurrency: accountCurrency, // v1: defaults to account-level
    status:            exp.status,
  }));

  // Section 4: Cohort
  const commissionRate    = profile ? Number(profile.commissionRate) : null;
  const commissionRatePct = commissionRate !== null ? Math.round(commissionRate * 100) : null;
  let termRemaining: string | null = null;
  if (user.cohortMember && user.cohortEndDate) {
    const msLeft = new Date(user.cohortEndDate).getTime() - Date.now();
    if (msLeft > 0) {
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      termRemaining = daysLeft > 30
        ? `${Math.ceil(daysLeft / 30)} months remaining`
        : `${daysLeft} days remaining`;
    } else {
      termRemaining = 'Cohort term ended';
    }
  }

  return {
    profile: {
      name:        operatorName,
      email:       user.email,
      phone:       user.phone ?? null,
      memberSince: user.createdAt.toISOString(),
    },
    verification: {
      kycStatus,
      verificationLevel,
      documentsOnFile: [], // no schema field — degrade gracefully
    },
    payout: {
      accountCurrency,
      bankAccount:            null, // no schema field — display "Managed by verification team"
      perExperienceBreakdown,
    },
    cohort: {
      membershipStatus: user.cohortMember ? 'cohort' : 'standard',
      commissionRate,
      commissionRatePct,
      termRemaining,
    },
    meta: { operatorUserId },
  };
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const roles = getUserRoles(sessionClaims?.publicMetadata as Record<string, unknown>);
  const isOperator = roles.some(r => r.toUpperCase() === 'OPERATOR');
  const isAdmin    = roles.some(r => ['ADMIN', 'SUPERADMIN'].includes(r.toUpperCase()));
  if (!isOperator && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden — OPERATOR role required' }, { status: 403 });
  }

  const db = getPrismaClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const user = await db.user.findUnique({ where: { clerkId: clerkUserId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'User record not found. Retry after a moment.' }, { status: 404 });

  const settings = await buildSettingsResponse(db, user.id);
  if (!settings) return NextResponse.json({ error: 'Settings not found.' }, { status: 404 });

  console.log(`[operator/settings GET] operatorUserId=${user.id}`);
  return NextResponse.json(settings);
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const roles = getUserRoles(sessionClaims?.publicMetadata as Record<string, unknown>);
  const isOperator = roles.some(r => r.toUpperCase() === 'OPERATOR');
  const isAdmin    = roles.some(r => ['ADMIN', 'SUPERADMIN'].includes(r.toUpperCase()));
  if (!isOperator && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden — OPERATOR role required' }, { status: 403 });
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate payoutCurrency
  const { payoutCurrency } = body;
  if (!payoutCurrency || !VALID_CURRENCIES.includes(payoutCurrency as ValidCurrency)) {
    return NextResponse.json(
      { error: 'INVALID_PAYOUT_CURRENCY', message: `payoutCurrency must be one of: ${VALID_CURRENCIES.join(', ')}` },
      { status: 422 }
    );
  }

  const db = getPrismaClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const user = await db.user.findUnique({ where: { clerkId: clerkUserId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'User record not found. Retry after a moment.' }, { status: 404 });

  // Update User.preferredCurrency (shared account-level field — intentional; see AC-7b)
  await db.user.update({
    where: { id: user.id },
    data:  { preferredCurrency: payoutCurrency as ValidCurrency },
  });

  console.log(`[operator/settings PATCH] operatorUserId=${user.id} payoutCurrency=${payoutCurrency}`);

  // Return updated settings
  const settings = await buildSettingsResponse(db, user.id);
  if (!settings) return NextResponse.json({ error: 'Settings not found after update.' }, { status: 404 });

  return NextResponse.json(settings);
}

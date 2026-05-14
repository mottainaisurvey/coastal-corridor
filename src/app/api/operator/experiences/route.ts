/**
 * GET /api/operator/experiences
 *
 * CC-C-09-C-1 — AC-1a: Operator experiences list endpoint.
 *
 * Returns the authenticated operator's Experience records.
 * Fields returned per experience:
 *   id, owambeExperienceId, name, status, experienceType,
 *   durationMinutes, capacity, pricingModel, basePrice,
 *   baseCurrency, meetingPointDescription, ageRestriction,
 *   fitnessRequirement, weatherDependent, equipmentProvided,
 *   equipmentRequired, verificationLevel, verifiedAt,
 *   createdAt, updatedAt
 *   + primaryImage: first ExperienceImage where isPrimary=true (or first image)
 *
 * Sort order (AC-1e): ACTIVE first, then UNDER_REVIEW, then INACTIVE.
 *   Within each status group, newest first by createdAt.
 *
 * Authentication: Clerk session. OPERATOR role required.
 * Per-operator isolation: filtered by operatorUserId = authenticated user's User.id.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';
import { getUserRoles } from '@/lib/user-roles';

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, UNDER_REVIEW: 1, INACTIVE: 2 };

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // 2. Role guard
  const roles = getUserRoles(sessionClaims?.publicMetadata as Record<string, unknown>);
  const isOperator = roles.some(r => r.toUpperCase() === 'OPERATOR');
  const isAdmin    = roles.some(r => ['ADMIN', 'SUPERADMIN'].includes(r.toUpperCase()));
  if (!isOperator && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden — OPERATOR role required' }, { status: 403 });
  }

  // 3. DB availability
  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // 4. Look up CC User
  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User record not found. Retry after a moment.' }, { status: 404 });
  }

  const operatorUserId = user.id;

  // 5. Fetch experiences with primary image
  const experiences = await db.experience.findMany({
    where: { operatorUserId },
    select: {
      id:                     true,
      owambeExperienceId:     true,
      name:                   true,
      status:                 true,
      experienceType:         true,
      durationMinutes:        true,
      capacity:               true,
      pricingModel:           true,
      basePrice:              true,
      baseCurrency:           true,
      meetingPointDescription: true,
      ageRestriction:         true,
      fitnessRequirement:     true,
      weatherDependent:       true,
      equipmentProvided:      true,
      equipmentRequired:      true,
      verificationLevel:      true,
      verifiedAt:             true,
      createdAt:              true,
      updatedAt:              true,
      images: {
        where:   { isPrimary: true },
        select:  { url: true, caption: true },
        take:    1,
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 6. Sort: ACTIVE → UNDER_REVIEW → INACTIVE, newest-first within each group
  const sorted = [...experiences].sort((a, b) => {
    const sa = STATUS_ORDER[a.status as string] ?? 99;
    const sb = STATUS_ORDER[b.status as string] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // 7. Flatten primaryImage
  const result = sorted.map(exp => ({
    ...exp,
    basePrice:    Number(exp.basePrice),
    primaryImage: exp.images[0] ?? null,
    images:       undefined,
  }));

  console.log(`[operator/experiences] operatorUserId=${operatorUserId} count=${result.length}`);

  return NextResponse.json({ experiences: result, meta: { operatorUserId } });
}

/**
 * GET /api/host/properties
 *
 * CC-C-08-C-1 AC-1a — Host properties list endpoint.
 *
 * Returns the authenticated host's StayProperty records with:
 *   - id, name, status, propertyType
 *   - city, state (location)
 *   - roomCount (count of related Room records)
 *   - primaryPhotoUrl (first StayPropertyImage with isPrimary=true, or null)
 *   - createdAt
 *
 * Sort order: ACTIVE first, then UNDER_REVIEW, then INACTIVE.
 * Within each status group, newest first by createdAt (AC-1d).
 * All statuses included (AC-1a).
 *
 * Authentication: Clerk session. HOST role required (AC-4a).
 * Per-host isolation: filtered to authenticated host's User.id (AC-4b).
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, UNDER_REVIEW: 1, INACTIVE: 2 };

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 });
  }
  if (user.role !== 'HOST') {
    return NextResponse.json({ error: 'Forbidden — HOST role required', role: user.role }, { status: 403 });
  }

  const properties = await db.stayProperty.findMany({
    where: { hostUserId: user.id },
    select: {
      id: true,
      name: true,
      status: true,
      propertyType: true,
      city: true,
      state: true,
      createdAt: true,
      rooms: { select: { id: true } },
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
  });

  // Sort: ACTIVE → UNDER_REVIEW → INACTIVE, newest first within group
  const sorted = properties.sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const result = sorted.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    propertyType: p.propertyType,
    city: p.city,
    state: p.state,
    roomCount: p.rooms.length,
    primaryPhotoUrl: p.images[0]?.url ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  console.log(`[api/host/properties] clerkUserId=${clerkUserId} hostUserId=${user.id} count=${result.length}`);

  return NextResponse.json({ properties: result, count: result.length });
}

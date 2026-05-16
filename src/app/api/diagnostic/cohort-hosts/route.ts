/**
 * GET  /api/diagnostic/cohort-hosts
 *   Returns all User records with cohortMember=true, including their
 *   HostProfile.commissionRate and linked StayProperty owambePropertyId.
 *   Used by CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01 AC-0c.
 *
 * POST /api/diagnostic/cohort-hosts
 *   Sets cohortMember=true on a User by email. Staging-only probe helper.
 *   Body: { email: string }
 *
 * Protected by x-diagnostic-secret header.
 * Only active when VERCEL_ENV !== 'production'.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

function guardAuth(req: NextRequest) {
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authError = guardAuth(req);
  if (authError) return authError;

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const cohortHosts = await prisma.user.findMany({
    where: { cohortMember: true, role: 'HOST' },
    select: {
      id: true,
      email: true,
      cohortMember: true,
      owambeUserId: true,
      hostProfile: {
        select: {
          id: true,
          commissionRate: true,
          displayName: true,
        },
      },
      stayProperties: {
        select: {
          id: true,
          owambePropertyId: true,
          name: true,
          status: true,
          rooms: {
            select: {
              id: true,
              owambeRoomId: true,
              name: true,
            },
            take: 1,
          },
        },
        take: 1,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    count: cohortHosts.length,
    cohortHosts: cohortHosts.map((u) => ({
      userId: u.id,
      email: u.email,
      cohortMember: u.cohortMember,
      owambeUserId: u.owambeUserId,
      hostProfile: u.hostProfile
        ? {
            id: u.hostProfile.id,
            commissionRate: u.hostProfile.commissionRate?.toString() ?? null,
            displayName: u.hostProfile.displayName,
          }
        : null,
      firstProperty: u.stayProperties[0]
        ? {
            propertyId: u.stayProperties[0].id,
            owambePropertyId: u.stayProperties[0].owambePropertyId,
            name: u.stayProperties[0].name,
            status: u.stayProperties[0].status,
            firstRoom: u.stayProperties[0].rooms[0]
              ? {
                  roomId: u.stayProperties[0].rooms[0].id,
                  owambeRoomId: u.stayProperties[0].rooms[0].owambeRoomId,
                  name: u.stayProperties[0].rooms[0].name,
                }
              : null,
          }
        : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authError = guardAuth(req);
  if (authError) return authError;

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { cohortMember: true },
    select: {
      id: true,
      email: true,
      cohortMember: true,
      role: true,
      hostProfile: {
        select: {
          commissionRate: true,
        },
      },
    },
  });

  return NextResponse.json({
    userId: updated.id,
    email: updated.email,
    cohortMember: updated.cohortMember,
    role: updated.role,
    hostProfileCommissionRate: updated.hostProfile?.commissionRate?.toString() ?? null,
    note: 'cohortMember set to true. HostProfile.commissionRate unchanged (still the stored value; CommissionCalculator will now use cohort_default path after AC-1 edit).',
  });
}

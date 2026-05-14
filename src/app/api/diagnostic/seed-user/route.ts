/**
 * POST /api/diagnostic/seed-user
 *
 * Creates or updates a user in the staging DB, linking to a Clerk user.
 * Idempotent: if the user already exists by email, updates clerkId and role.
 *
 * Protected by x-diagnostic-secret header.
 * Only active when VERCEL_ENV !== 'production'.
 *
 * Body: {
 *   clerkId: string,
 *   email: string,
 *   firstName: string,
 *   lastName: string,
 *   role: 'HOST' | 'OPERATOR' | 'BUYER',
 *   owambeUserId?: string,
 * }
 *
 * Response: { userId, email, role, created: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const { clerkId, email, firstName, lastName, role, owambeUserId } = body;

  if (!clerkId || !email || !role) {
    return NextResponse.json({ error: 'clerkId, email, and role are required' }, { status: 400 });
  }

  const validRoles = ['HOST', 'OPERATOR', 'BUYER', 'GUEST', 'PARTICIPANT'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
  }

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    let created = false;

    if (user) {
      // Update existing user with clerkId and role
      user = await prisma.user.update({
        where: { email },
        data: {
          clerkId,
          role: role as any,
          status: 'ACTIVE',
          ...(owambeUserId ? { owambeUserId } : {}),
        },
      });
    } else {
      // Create new user
      created = true;
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          role: role as any,
          status: 'ACTIVE',
          ...(owambeUserId ? { owambeUserId } : {}),
        },
      });
    }

    // Create profile if it doesn't exist
    const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          firstName: firstName ?? 'Founder',
          lastName: lastName ?? 'Test',
        },
      });
    } else {
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          firstName: firstName ?? existingProfile.firstName,
          lastName: lastName ?? existingProfile.lastName,
        },
      });
    }

    // Create role-specific profile if it doesn't exist
    if (role === 'HOST') {
      const existing = await prisma.hostProfile.findUnique({ where: { userId: user.id } });
      if (!existing) {
        await prisma.hostProfile.create({
          data: {
            userId: user.id,
            displayName: `${firstName ?? 'Founder'} ${lastName ?? 'TestHost'}`,
            businessName: 'Founder Test Stays',
          },
        });
      }
    } else if (role === 'OPERATOR') {
      const existing = await prisma.operatorProfile.findUnique({ where: { userId: user.id } });
      if (!existing) {
        await prisma.operatorProfile.create({
          data: {
            userId: user.id,
            displayName: `${firstName ?? 'Founder'} ${lastName ?? 'TestOperator'}`,
            businessName: 'Founder Test Experiences',
          },
        });
      }
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      role: user.role,
      clerkId: user.clerkId,
      created,
    });
  } catch (err: any) {
    console.error('[seed-user] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

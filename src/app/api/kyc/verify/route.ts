export const dynamic = 'force-dynamic';

/**
 * POST /api/kyc/verify
 * Initiates KYC verification for the authenticated user via SmileIdentityAdapter (CC-C-05).
 * Persists the verification ID to User.kycStatus and logs an audit entry.
 *
 * GET /api/kyc/verify
 * Returns the current KYC status for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getSmileIdentityAdapter, type KycIdType, type KycUserType } from '@/lib/smile-identity-adapter';
import { validateNIN, validateBVN } from '@/lib/kyc';

// ─── POST /api/kyc/verify ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.kycStatus?.startsWith('APPROVED')) {
      return NextResponse.json(
        { error: 'KYC already approved for this account' },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, phone, dateOfBirth, idType, idNumber, country, userType } = body;

    if (!firstName || !lastName || !idType || !idNumber) {
      return NextResponse.json(
        { error: 'firstName, lastName, idType, and idNumber are required' },
        { status: 400 }
      );
    }

    const validIdTypes: KycIdType[] = ['NIN', 'BVN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTER_ID'];
    if (!validIdTypes.includes(idType as KycIdType)) {
      return NextResponse.json(
        { error: `idType must be one of: ${validIdTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (idType === 'NIN' && !validateNIN(idNumber)) {
      return NextResponse.json({ error: 'NIN must be exactly 11 digits' }, { status: 400 });
    }
    if (idType === 'BVN' && !validateBVN(idNumber)) {
      return NextResponse.json({ error: 'BVN must be exactly 11 digits' }, { status: 400 });
    }

    // Derive userType from User.role if not supplied in the request body
    const resolvedUserType: KycUserType = (() => {
      if (userType) return userType as KycUserType;
      switch (user.role) {
        case 'HOST': return 'STAYS_HOST';
        case 'OPERATOR': return 'EXPERIENCES_OPERATOR';
        case 'AGENT': return 'AGENT';
        case 'ADMIN': return 'ADMIN';
        default: return 'GUEST';
      }
    })();

    const adapter = getSmileIdentityAdapter();
    const result = await adapter.initiateKYC({
      userId: user.id,
      userType: resolvedUserType,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      idType: idType as KycIdType,
      idNumber,
      country: country ?? 'NG',
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { kycStatus: `${result.status}:${result.verificationId}` },
    });

    await prisma.auditEntry.create({
      data: {
        userId: user.id,
        entityType: 'User',
        entityId: user.id,
        action: 'create',
        metadata: JSON.stringify({
          event: 'kyc_initiated',
          verificationId: result.verificationId,
          idType,
          userType: resolvedUserType,
          status: result.status,
          smileMode: adapter.getMode(),
        }),
      },
    });

    return NextResponse.json(
      {
        status: result.status,
        verificationId: result.verificationId,
        message: result.message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[KYC verify]', error);
    return NextResponse.json({ error: 'KYC initiation failed' }, { status: 500 });
  }
}

// ─── GET /api/kyc/verify ──────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkId },
      select: { kycStatus: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const parts = user.kycStatus?.split(':') ?? [];
    const kycState = parts[0] || 'NOT_STARTED';
    const verificationId = parts.slice(1).join(':') || null;

    return NextResponse.json({ kycStatus: kycState, verificationId });
  } catch (error) {
    console.error('[KYC status]', error);
    return NextResponse.json({ error: 'Failed to retrieve KYC status' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { initiateKYCVerification, validateNIN, validateBVN, validatePhoneNumber } from '@/lib/kyc';

/**
 * POST /api/kyc/verify
 *
 * Initiates KYC verification for a user.
 *
 * SECURITY NOTES:
 * - All KYC data is encrypted before storage
 * - Verification results are logged for audit trail
 * - NDPR compliance required for data handling
 * - KYC data is never shared with third parties without consent
 */

const KYCVerificationSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(10),
  idType: z.enum(['NIN', 'BVN', 'PASSPORT', 'DRIVERS_LICENSE']),
  idNumber: z.string().min(5),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validationResult = KYCVerificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, firstName, lastName, email, phoneNumber, idType, idNumber, dateOfBirth } =
      validationResult.data;

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use +234XXXXXXXXXX or 0XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // Validate ID number based on type
    if (idType === 'NIN' && !validateNIN(idNumber)) {
      return NextResponse.json(
        { error: 'Invalid NIN format. Must be 11 digits' },
        { status: 400 }
      );
    }

    if (idType === 'BVN' && !validateBVN(idNumber)) {
      return NextResponse.json(
        { error: 'Invalid BVN format. Must be 11 digits' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has pending or approved KYC
    if (user.kycStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'User already verified' },
        { status: 400 }
      );
    }

    // Initiate KYC verification with Smile Identity
    const kycResult = await initiateKYCVerification({
      userId,
      firstName,
      lastName,
      email,
      phoneNumber,
      idType,
      idNumber,
      dateOfBirth,
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: kycResult.verificationId,
      },
    });

    // Log audit entry
    await prisma.auditEntry.create({
      data: {
        userId,
        entityType: 'KYCVerification',
        entityId: kycResult.verificationId,
        action: 'create',
        metadata: JSON.stringify({ idType, status: kycResult.status }),
      },
    });

    return NextResponse.json(
      {
        data: {
          verificationId: kycResult.verificationId,
          status: kycResult.status,
          message: kycResult.message,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('KYC verification failed:', error);
    return NextResponse.json(
      { error: 'KYC verification failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        kycStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        userId: user.id,
        email: user.email,
        kycStatus: user.kycStatus || 'NOT_STARTED',
        verified: user.kycStatus === 'APPROVED',
      },
    });
  } catch (error) {
    console.error('Failed to fetch KYC status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    );
  }
}

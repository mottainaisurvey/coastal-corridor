export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/webhooks/kyc
 *
 * Webhook handler for Smile Identity KYC verification results.
 * Called when KYC verification is completed.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { verificationId, status, userId, verified, data } = body;

    if (!verificationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user by KYC status (which contains the verification ID)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user KYC status
    const kycStatus = verified ? 'APPROVED' : 'REJECTED';
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus,
      },
    });

    // Log audit entry
    await prisma.auditEntry.create({
      data: {
        userId,
        entityType: 'KYCVerification',
        entityId: verificationId,
        action: 'update',
        metadata: JSON.stringify({ status: kycStatus, verified }),
      },
    });

    // Send email notification
    if (user.email) {
      const emailSubject = verified
        ? 'KYC Verification Approved'
        : 'KYC Verification Rejected';

      const emailHtml = verified
        ? `
          <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="font-size: 24px; font-weight: 300;">Verification Approved</h1>
            <p>Congratulations! Your identity verification has been approved.</p>
            <p>You can now:</p>
            <ul>
              <li>List properties for sale</li>
              <li>Make property inquiries</li>
              <li>Participate in transactions</li>
            </ul>
            <p>Thank you for using Coastal Corridor.</p>
          </div>
        `
        : `
          <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="font-size: 24px; font-weight: 300;">Verification Rejected</h1>
            <p>Your identity verification could not be completed at this time.</p>
            <p>Please contact support for more information.</p>
          </div>
        `;

      try {
        await sendEmail({
          to: user.email,
          subject: emailSubject,
          htmlBody: emailHtml,
        });
      } catch (emailError) {
        console.error('Failed to send KYC notification email:', emailError);
      }
    }

    return NextResponse.json({
      received: true,
      status: kycStatus,
    });
  } catch (error) {
    console.error('KYC webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

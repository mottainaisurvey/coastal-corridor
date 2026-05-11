export const dynamic = 'force-dynamic';

/**
 * POST /api/kyc/callback
 *
 * Smile Identity async callback handler — CC-C-05.
 *
 * Receives the final KYC result from Smile Identity after an async job
 * completes. Updates User.kycStatus, writes an audit entry, and sends
 * an email notification.
 *
 * Payload (Smile Identity native format):
 *   SmileJobID      — Smile's internal job ID
 *   PartnerParams   — { user_id, job_id, job_type }
 *   ResultCode      — "1012" (APPROVED), "1013" (REVIEW), other (REJECTED)
 *   ResultText      — Human-readable result description
 *
 * Also accepts simplified test payload:
 *   smileJobId, partner_params, resultCode, resultText, userId, verificationId
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getSmileIdentityAdapter } from '@/lib/smile-identity-adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both Smile Identity native payload and simplified test payload
    const smileJobId: string | undefined = body.SmileJobID ?? body.smileJobId;
    const partnerParams: Record<string, unknown> =
      body.PartnerParams ?? body.partner_params ?? {};
    const internalUserId: string | undefined =
      (partnerParams['user_id'] as string | undefined) ?? body.userId;
    const verificationId: string | undefined =
      (partnerParams['job_id'] as string | undefined) ?? body.verificationId;
    const resultCode: string = String(body.ResultCode ?? body.resultCode ?? '');
    const resultText: string = String(body.ResultText ?? body.resultText ?? '');

    if (!internalUserId) {
      return NextResponse.json(
        { error: 'Missing user_id in callback payload' },
        { status: 400 }
      );
    }

    // Map result code to outcome using adapter helper
    const adapter = getSmileIdentityAdapter();
    const { status: kycOutcome } = adapter.mapResultCode(resultCode);

    const user = await prisma.user.findUnique({
      where: { id: internalUserId },
      include: { profile: true },
    });

    if (!user) {
      console.error('[KYC callback] User not found:', internalUserId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newKycStatus = verificationId
      ? `${kycOutcome}:${verificationId}`
      : kycOutcome;

    await prisma.user.update({
      where: { id: internalUserId },
      data: { kycStatus: newKycStatus },
    });

    await prisma.auditEntry.create({
      data: {
        userId: internalUserId,
        entityType: 'User',
        entityId: internalUserId,
        action: 'update',
        metadata: JSON.stringify({
          event: 'kyc_result',
          outcome: kycOutcome,
          resultCode,
          resultText,
          smileJobId,
          verificationId,
        }),
      },
    });

    // Email notification
    if (user.email) {
      const name =
        user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user.email;
      const approved = kycOutcome === 'APPROVED';
      const review = kycOutcome === 'REVIEW';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

      const subject = approved
        ? 'Your identity verification has been approved'
        : review
        ? 'Your identity verification is under review'
        : 'Your identity verification could not be completed';

      const htmlBody = approved
        ? `<div style="font-family:'Inter Tight',sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="font-size:24px;font-weight:300;">Verification Approved ✓</h1><p>Hi ${name},</p><p>Your identity has been verified. You can now make property inquiries and participate in transactions on Coastal Corridor.</p><p><a href="${appUrl}/account">Go to your account →</a></p></div>`
        : review
        ? `<div style="font-family:'Inter Tight',sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="font-size:24px;font-weight:300;">Verification Under Review</h1><p>Hi ${name},</p><p>Your identity verification requires a manual review. Our team will complete this within 24 hours.</p></div>`
        : `<div style="font-family:'Inter Tight',sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="font-size:24px;font-weight:300;">Verification Could Not Be Completed</h1><p>Hi ${name},</p><p>We were unable to verify your identity. Please try again or contact support@coastalcorridor.africa.</p><p><a href="${appUrl}/account/kyc">Try again →</a></p></div>`;

      try {
        await sendEmail({ to: user.email, subject, htmlBody });
      } catch (emailError) {
        console.error('[KYC callback] Email notification failed:', emailError);
      }
    }

    console.info(
      `[KYC callback] Processed: userId=${internalUserId} outcome=${kycOutcome} ` +
      `smileJobId=${smileJobId ?? 'n/a'}`
    );

    return NextResponse.json({ received: true, outcome: kycOutcome });
  } catch (error) {
    console.error('[KYC callback] Processing failed:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

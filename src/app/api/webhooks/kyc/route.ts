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

    // Support both Smile Identity native payload and manual test payload
    const smileJobId = body.SmileJobID || body.smileJobId;
    const partnerParams = body.PartnerParams || body.partner_params || {};
    const internalUserId = partnerParams.user_id || body.userId;
    const verificationId = partnerParams.job_id || body.verificationId;
    const resultCode = body.ResultCode || body.resultCode;
    const resultText = body.ResultText || body.resultText || '';

    if (!internalUserId) {
      return NextResponse.json({ error: 'Missing user_id in webhook payload' }, { status: 400 });
    }

    // Smile Identity result codes:
    // 1012 = Exact Match (APPROVED), 1013 = Partial Match (REVIEW), others = REJECTED
    const approved = resultCode === '1012';
    const review = resultCode === '1013';
    const kycOutcome = approved ? 'APPROVED' : review ? 'REVIEW' : 'REJECTED';

    const user = await prisma.user.findUnique({
      where: { id: internalUserId },
      include: { profile: true },
    });

    if (!user) {
      console.error('[KYC webhook] User not found:', internalUserId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newKycStatus = verificationId ? `${kycOutcome}:${verificationId}` : kycOutcome;
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

    if (user.email) {
      const name = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;
      const subject = approved
        ? 'Your identity verification has been approved'
        : review
        ? 'Your identity verification is under review'
        : 'Your identity verification could not be completed';
      const htmlBody = approved
        ? `<div style="font-family:'Inter Tight',sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="font-size:24px;font-weight:300;">Verification Approved ✓</h1><p>Hi ${name},</p><p>Your identity has been verified. You can now make property inquiries and participate in transactions on Coastal Corridor.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/account">Go to your account →</a></p></div>`
        : review
        ? `<div style="font-family:'Inter Tight',sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="font-size:24px;font-weight:300;">Verification Under Review</h1><p>Hi ${name},</p><p>Your identity verification requires a manual review. Our team will complete this within 24 hours.</p></div>`
        : `<div style="font-family:'Inter Tight',sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="font-size:24px;font-weight:300;">Verification Could Not Be Completed</h1><p>Hi ${name},</p><p>We were unable to verify your identity. Please try again or contact support@coastalcorridor.africa.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/account/kyc">Try again →</a></p></div>`;
      try {
        await sendEmail({ to: user.email, subject, htmlBody });
      } catch (emailError) {
        console.error('[KYC webhook] Email failed:', emailError);
      }
    }

    return NextResponse.json({ received: true, outcome: kycOutcome });
  } catch (error) {
    console.error('[KYC webhook] Processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

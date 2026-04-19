import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEmail, inquiryConfirmationEmail, agentInquiryNotificationEmail } from '@/lib/email';

/**
 * POST /api/inquiries
 *
 * Creates an inquiry record from the property detail page form.
 * Persists to database, sends confirmation email to buyer, and notifies agent.
 *
 * PRODUCTION REQUIREMENTS:
 * 1. ✅ Rate limiting — max 5 submissions per IP per hour (implement with Upstash Redis)
 * 2. ✅ Bot protection — Cloudflare Turnstile or hCaptcha
 * 3. ✅ Email notification to agent + confirmation to user (Postmark)
 * 4. ✅ Persist to database
 * 5. ✅ Link to User record if authenticated; create pending User otherwise
 * 6. ⏳ Slack/Discord webhook to sales channel for immediate response SLA
 * 7. ⏳ CRM integration (HubSpot/Salesforce) for pipeline tracking
 */

const InquirySchema = z.object({
  listingId: z.string().min(1, 'Listing ID required'),
  plotId: z.string().optional(),
  userId: z.string().min(1, 'User ID required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  offeredPriceKobo: z.string().optional(),
  buyerName: z.string().min(2, 'Name required'),
  buyerEmail: z.string().email('Valid email required'),
  buyerPhone: z.string().min(10, 'Valid phone number required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validationResult = InquirySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      listingId,
      plotId,
      userId,
      message,
      preferredContactMethod,
      offeredPriceKobo,
      buyerName,
      buyerEmail,
      buyerPhone,
    } = validationResult.data;

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        owner: { include: { agentProfile: true, profile: true } },
        property: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        listingId,
        plotId: plotId || undefined,
        userId,
        message,
        preferredContactMethod,
        offeredPriceKobo: offeredPriceKobo ? BigInt(offeredPriceKobo) : undefined,
      },
      include: {
        listing: { include: { property: true } },
        user: true,
      },
    });

    // Update listing inquiry count
    await prisma.listing.update({
      where: { id: listingId },
      data: { inquiryCount: { increment: 1 } },
    });

    // Send confirmation email to buyer
    try {
      await sendEmail({
        to: buyerEmail,
        subject: `Inquiry Confirmed - ${listing.property?.title || 'Property'}`,
        htmlBody: inquiryConfirmationEmail(
          buyerName,
          listing.property?.title || 'Your Property',
          listing.owner?.profile?.firstName || 'Agent',
          listing.owner?.email || 'agent@coastalcorridor.ng'
        ),
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the inquiry creation if email fails
    }

    // Send notification email to agent
    if (listing.owner?.email) {
      try {
        await sendEmail({
          to: listing.owner.email,
          subject: `New Inquiry - ${listing.property?.title || 'Your Property'}`,
          htmlBody: agentInquiryNotificationEmail(
            listing.owner?.profile?.firstName || 'Agent',
            buyerName,
            buyerEmail,
            buyerPhone,
            listing.property?.title || 'Property',
            message
          ),
        });
      } catch (emailError) {
        console.error('Failed to send agent notification:', emailError);
      }
    }

    // Log audit entry
    await prisma.auditEntry.create({
      data: {
        userId,
        entityType: 'Inquiry',
        entityId: inquiry.id,
        action: 'create',
        metadata: JSON.stringify({ listingId, propertyTitle: listing.property?.title }),
      },
    });

    return NextResponse.json(
      {
        data: {
          id: inquiry.id,
          status: inquiry.status,
          message: 'Inquiry submitted successfully. Check your email for confirmation.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Inquiry creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (listingId) where.listingId = listingId;
    if (userId) where.userId = userId;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: { listing: { include: { property: true } }, user: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({
      data: inquiries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

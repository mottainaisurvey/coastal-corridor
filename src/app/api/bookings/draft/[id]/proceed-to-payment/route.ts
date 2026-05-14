/**
 * POST /api/bookings/draft/[id]/proceed-to-payment — CC-D-01-C AC-2
 *
 * Wires the actual payment flow from BookingDraft to ExperienceBooking.
 *
 * Steps:
 *   1. Validate draft has all required fields (groupSize, guestName,
 *      guestEmail, guestPhone) — carried over from CC-D-01-B
 *   2. Idempotency: if draft already has experienceBookingId, return
 *      the existing payment URL without creating a duplicate (AC-2c)
 *   3. Call createOrGetPlaceholderUser to get/create the User (AC-1)
 *   4. Re-check capacity (TimeSlot.capacity - spotsBooked >= groupSize)
 *   5. Resolve operator commissionRate from OperatorProfile
 *   6. Create ExperienceBooking with status=PENDING in a Prisma
 *      transaction (AC-2b atomicity)
 *   7. Update BookingDraft with status=PENDING_PAYMENT and
 *      experienceBookingId reference
 *   8. Route to payment provider based on currency (AC-3):
 *      - NGN → Paystack initializeTransaction → return authorizationUrl
 *      - USD/GBP → Stripe createPaymentIntent → return /experiences/checkout/[id]
 *
 * Returns: { paymentUrl: string, bookingId: string, experienceBookingId: string }
 *
 * Authentication: PUBLIC, session-token-gated via HttpOnly cookie.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Decimal } from '@prisma/client/runtime/library';
import { createOrGetPlaceholderUser } from '@/lib/placeholder-user';
import { initializeTransaction } from '@/lib/paystack';
import { getStripeAdapter } from '@/lib/stripe-adapter';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_COMMISSION_RATE = new Decimal('0.15'); // 15% fallback
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coastalcorridor.com';

// ─── POST /api/bookings/draft/[id]/proceed-to-payment ─────────────────────────
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // ── 1. Resolve draft ────────────────────────────────────────────────────────
  const draft = await prisma.bookingDraft.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      sessionToken: true,
      status: true,
      groupSize: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      totalAmount: true,
      currency: true,
      expiresAt: true,
      experienceId: true,
      timeSlotId: true,
      experienceBookingId: true,
      experience: {
        select: {
          id: true,
          operatorUserId: true,
          capacity: true,
          basePrice: true,
          baseCurrency: true,
          name: true,
        },
      },
      timeSlot: {
        select: {
          id: true,
          capacity: true,
          spotsBooked: true,
          status: true,
          rate: true,
          currency: true,
        },
      },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: 'Draft booking not found' }, { status: 404 });
  }

  // ── 2. Session token guard ──────────────────────────────────────────────────
  let sessionToken: string | null = null;
  try {
    const cookieStore = cookies();
    sessionToken = cookieStore.get('booking_session')?.value ?? null;
  } catch {
    // no-op
  }
  if (!sessionToken || sessionToken !== draft.sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 3. Status guard ─────────────────────────────────────────────────────────
  if (draft.status !== 'DRAFT' && draft.status !== 'PENDING_PAYMENT') {
    return NextResponse.json(
      { error: 'Booking is no longer in a payable state', code: 'NOT_PAYABLE', status: draft.status },
      { status: 409 }
    );
  }

  // ── 4. Expiry check ─────────────────────────────────────────────────────────
  if (new Date() > new Date(draft.expiresAt)) {
    return NextResponse.json({ error: 'Draft booking has expired' }, { status: 410 });
  }

  // ── 5. Required fields validation ───────────────────────────────────────────
  const missing: string[] = [];
  if (!draft.groupSize) missing.push('groupSize');
  if (!draft.guestName) missing.push('guestName');
  if (!draft.guestEmail) missing.push('guestEmail');
  if (!draft.guestPhone) missing.push('guestPhone');
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Required fields are missing', fields: missing },
      { status: 422 }
    );
  }

  // ── 6. Idempotency: if ExperienceBooking already created, return existing URL ─
  // AC-2c: if proceed-to-payment is called twice for the same draft (e.g., guest
  // clicks button twice), the second call detects the existing ExperienceBooking
  // and returns the same payment URL without creating a duplicate.
  if (draft.experienceBookingId && draft.status === 'PENDING_PAYMENT') {
    const existingBooking = await prisma.experienceBooking.findUnique({
      where: { id: draft.experienceBookingId },
      select: { id: true, currency: true, stripePaymentIntentId: true },
    });
    if (existingBooking) {
      const paymentUrl = buildExistingPaymentUrl(existingBooking);
      console.log(
        `[proceed-to-payment] idempotent re-call: draft=${params.id} ` +
        `existingBooking=${existingBooking.id} paymentUrl=${paymentUrl}`
      );
      return NextResponse.json({
        bookingId: params.id,
        experienceBookingId: existingBooking.id,
        paymentUrl,
        idempotent: true,
      });
    }
  }

  // ── 7. Live capacity re-check ───────────────────────────────────────────────
  const slot = await prisma.timeSlot.findUnique({
    where: { id: draft.timeSlotId },
    select: { capacity: true, spotsBooked: true, status: true, rate: true, currency: true },
  });
  if (!slot) {
    return NextResponse.json({ error: 'Time slot no longer exists' }, { status: 422 });
  }
  if (slot.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Slot is no longer available', code: 'SLOT_CANCELLED' }, { status: 409 });
  }
  const spotsRemaining = slot.capacity - slot.spotsBooked;
  if (draft.groupSize! > spotsRemaining) {
    return NextResponse.json(
      { error: 'Slot is no longer available for your group size', code: 'SLOT_FULL' },
      { status: 409 }
    );
  }

  // ── 8. Resolve pricing ──────────────────────────────────────────────────────
  // Use slot.rate if available, otherwise fall back to experience.basePrice
  const unitRate = slot.rate ?? draft.experience.basePrice;
  const currency = slot.currency; // Currency enum: NGN | USD | GBP
  const totalAmount = unitRate.mul(new Decimal(draft.groupSize!));

  // ── 9. Resolve operator commission rate ─────────────────────────────────────
  const operatorProfile = await prisma.operatorProfile.findUnique({
    where: { userId: draft.experience.operatorUserId },
    select: { commissionRate: true, paystackSubaccountCode: true },
  });
  const commissionRate = operatorProfile?.commissionRate ?? DEFAULT_COMMISSION_RATE;
  const channelCommissionAmount = totalAmount.mul(commissionRate).toDecimalPlaces(2);
  const netToOperator = totalAmount.sub(channelCommissionAmount).toDecimalPlaces(2);
  // channelCommissionPercent stored as percentage (e.g., 15.00 for 15%)
  const channelCommissionPercent = commissionRate.mul(new Decimal('100')).toDecimalPlaces(2);

  // ── 10. Create placeholder User ─────────────────────────────────────────────
  let placeholderUser;
  try {
    placeholderUser = await createOrGetPlaceholderUser(
      {
        email: draft.guestEmail!,
        displayName: draft.guestName!,
        phone: draft.guestPhone ?? undefined,
      },
      prisma
    );
  } catch (err) {
    console.error('[proceed-to-payment] placeholder user creation failed:', err);
    return NextResponse.json({ error: 'Failed to create guest user record' }, { status: 500 });
  }

  // ── 11. Atomic transaction: create ExperienceBooking + update BookingDraft ──
  // AC-2b: all DB writes in a Prisma transaction; if any step fails, none commit.
  let experienceBooking;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create ExperienceBooking with status=PENDING, paymentStatus=PENDING
      const booking = await tx.experienceBooking.create({
        data: {
          experienceId: draft.experienceId,
          timeSlotId: draft.timeSlotId,
          participantUserId: placeholderUser.id,
          numberOfParticipants: draft.groupSize!,
          participantNames: [draft.guestName!],
          totalAmount,
          currency,
          channelCommissionAmount,
          channelCommissionPercent,
          netToOperator,
          status: 'PENDING',        // ExperienceBookingStatus.PENDING = awaiting payment
          paymentStatus: 'PENDING', // PaymentStatus.PENDING
          owambeBookingId: null,    // filled by CC-D-01-D outbox sync after CONFIRMED
          outboundIdempotencyKey: null,
        },
      });

      // Update BookingDraft: status=PENDING_PAYMENT, store experienceBookingId
      await tx.bookingDraft.update({
        where: { id: params.id },
        data: {
          status: 'PENDING_PAYMENT',
          experienceBookingId: booking.id,
        },
      });

      return booking;
    });
    experienceBooking = result;
  } catch (err) {
    console.error('[proceed-to-payment] transaction failed:', err);
    return NextResponse.json({ error: 'Failed to create booking record' }, { status: 500 });
  }

  // ── 12. Route to payment provider ───────────────────────────────────────────
  // AC-3a: NGN → Paystack; USD/GBP → Stripe; other → reject
  let paymentUrl: string;
  try {
    paymentUrl = await routeToPaymentProvider({
      experienceBookingId: experienceBooking.id,
      currency,
      totalAmount,
      guestEmail: draft.guestEmail!,
      guestName: draft.guestName!,
      experienceName: draft.experience.name,
      paystackSubaccountCode: operatorProfile?.paystackSubaccountCode ?? undefined,
      draftId: params.id,
    });
  } catch (err) {
    console.error('[proceed-to-payment] payment provider routing failed:', err);
    // ExperienceBooking is created but payment URL failed — leave in PENDING state
    // Guest can retry; cleanup is Phase E.
    return NextResponse.json({ error: 'Payment provider unavailable' }, { status: 502 });
  }

  console.log(
    `[proceed-to-payment] booking created: draft=${params.id} ` +
    `booking=${experienceBooking.id} currency=${currency} paymentUrl=${paymentUrl}`
  );

  return NextResponse.json({
    bookingId: params.id,
    experienceBookingId: experienceBooking.id,
    paymentUrl,
  });
}

// ─── Payment provider routing ─────────────────────────────────────────────────

interface RouteToPaymentInput {
  experienceBookingId: string;
  currency: 'NGN' | 'USD' | 'GBP';
  totalAmount: Decimal;
  guestEmail: string;
  guestName: string;
  experienceName: string;
  paystackSubaccountCode?: string;
  draftId: string;
}

async function routeToPaymentProvider(input: RouteToPaymentInput): Promise<string> {
  const { currency, experienceBookingId, totalAmount, guestEmail, experienceName } = input;

  if (currency === 'NGN') {
    // ── AC-3b: Paystack initialization ────────────────────────────────────────
    // Amount in kobo (NGN smallest unit: 1 NGN = 100 kobo)
    const amountKobo = Math.round(totalAmount.mul(new Decimal('100')).toNumber());
    const callbackUrl = `${APP_BASE_URL}/booking-complete/${experienceBookingId}`;

    const result = await initializeTransaction({
      email: guestEmail,
      amountKobo,
      currency: 'NGN',
      reference: experienceBookingId, // AC-3b: reference = ExperienceBooking.id
      callbackUrl,
      metadata: {
        experienceBookingId,
        bookingDraftId: input.draftId,
        source: 'CC-EXPERIENCE-BOOKING',
        reservation_type: 'EXPERIENCE', // used by webhook handler to route correctly
        entity_id: experienceBookingId,
        experience_name: experienceName,
      },
      subaccountCode: input.paystackSubaccountCode,
    });

    console.log(
      `[proceed-to-payment] Paystack init: booking=${experienceBookingId} ` +
      `amountKobo=${amountKobo} authorizationUrl=${result.authorizationUrl}`
    );

    return result.authorizationUrl;
  }

  if (currency === 'USD' || currency === 'GBP') {
    // ── AC-3c: Stripe PaymentIntent creation ──────────────────────────────────
    // Amount in smallest unit (cents for USD, pence for GBP)
    const amountSmallestUnit = Math.round(totalAmount.mul(new Decimal('100')).toNumber());

    const adapter = getStripeAdapter();
    const intent = await adapter.createPaymentIntent({
      amountSmallestUnit,
      currency,
      description: `Coastal Corridor Experience Booking: ${experienceName}`,
      metadata: {
        experienceBookingId,
        bookingDraftId: input.draftId,
        source: 'CC-EXPERIENCE-BOOKING',
      },
    });

    // Store the PaymentIntent ID on the ExperienceBooking for webhook lookup
    await prisma.experienceBooking.update({
      where: { id: experienceBookingId },
      data: { stripePaymentIntentId: intent.paymentIntentId },
    });

    console.log(
      `[proceed-to-payment] Stripe PaymentIntent: booking=${experienceBookingId} ` +
      `pi=${intent.paymentIntentId} currency=${currency}`
    );

    // AC-3d: return the experiences checkout page URL
    return `/experiences/checkout/${experienceBookingId}`;
  }

  // AC-3a: defensive guard for unexpected currency
  throw new Error(`Unsupported currency for payment routing: ${currency}`);
}

// ─── Build payment URL for idempotent re-calls ────────────────────────────────

function buildExistingPaymentUrl(booking: {
  id: string;
  currency: string;
  stripePaymentIntentId?: string | null;
}): string {
  if (booking.currency === 'NGN') {
    // Paystack: redirect to booking-complete pending page
    return `/booking-complete/${booking.id}?status=pending`;
  }
  // Stripe: return the checkout page
  return `/experiences/checkout/${booking.id}`;
}

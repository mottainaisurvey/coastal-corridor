/**
 * GET /api/experiences/checkout/[experienceBookingId] — CC-D-01-C AC-3c
 *
 * Returns the Stripe client secret for the experiences checkout page.
 * The ExperienceBooking must have a stripePaymentIntentId set (done by
 * proceed-to-payment) and status=PENDING / paymentStatus=PENDING.
 *
 * Returns: {
 *   clientSecret: string,
 *   publishableKey: string,
 *   booking: { id, experienceName, totalAmount, currency, guestName }
 * }
 *
 * Authentication: PUBLIC — no auth required (anonymous guest booking).
 * The booking ID is treated as a capability token (hard to guess CUID).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStripeAdapter } from '@/lib/stripe-adapter';

export async function GET(
  _req: NextRequest,
  { params }: { params: { experienceBookingId: string } }
) {
  const { experienceBookingId } = params;

  // Resolve the ExperienceBooking with related data
  const booking = await prisma.experienceBooking.findUnique({
    where: { id: experienceBookingId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      currency: true,
      stripePaymentIntentId: true,
      numberOfParticipants: true,
      experience: {
        select: {
          name: true,
        },
      },
      participant: {
        select: {
          email: true,
        },
      },
      timeSlot: {
        select: {
          startDateTime: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Only serve checkout for bookings awaiting payment
  if (booking.paymentStatus !== 'PENDING') {
    return NextResponse.json(
      { error: 'Booking is not awaiting payment', paymentStatus: booking.paymentStatus },
      { status: 409 }
    );
  }

  if (!booking.stripePaymentIntentId) {
    return NextResponse.json(
      { error: 'No Stripe PaymentIntent found for this booking' },
      { status: 422 }
    );
  }

  // Retrieve the PaymentIntent client secret from Stripe
  let clientSecret: string | null = null;
  let publishableKey: string = '';
  try {
    const adapter = getStripeAdapter();
    publishableKey = adapter.getPublishableKey();

    // Retrieve the PaymentIntent to get the client_secret
    // We use the Stripe SDK via the adapter's underlying client
    // The client_secret is returned when the PaymentIntent is created;
    // we stored only the ID. Retrieve it now.
    const stripeClient = (adapter as any).client as import('stripe').default;
    const pi = await stripeClient.paymentIntents.retrieve(booking.stripePaymentIntentId);
    clientSecret = pi.client_secret;
  } catch (err) {
    console.error('[experiences/checkout] Stripe retrieve error:', err);
    return NextResponse.json({ error: 'Failed to retrieve payment details' }, { status: 502 });
  }

  if (!clientSecret) {
    return NextResponse.json({ error: 'Payment intent has no client secret' }, { status: 422 });
  }

  return NextResponse.json({
    clientSecret,
    publishableKey,
    booking: {
      id: booking.id,
      experienceName: booking.experience.name,
      totalAmount: booking.totalAmount.toString(),
      currency: booking.currency,
      numberOfParticipants: booking.numberOfParticipants,
      slotDateTime: booking.timeSlot.startDateTime,
      guestEmail: booking.participant.email,
    },
  });
}

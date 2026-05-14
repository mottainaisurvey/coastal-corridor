/**
 * POST /api/bookings/draft — CC-D-01-B AC-2a
 *
 * Creates a new BookingDraft record for the anonymous guest booking flow.
 *
 * Body: { experienceId: string, timeSlotId: string }
 *
 * Validates:
 *   - experienceId exists and is ACTIVE
 *   - timeSlotId exists, belongs to that experience, is in the future,
 *     has available capacity (spotsRemaining > 0)
 *
 * Creates BookingDraft with:
 *   - status: DRAFT
 *   - groupSize: null (filled in step 2)
 *   - guestName, guestEmail, guestPhone: null (filled in step 3)
 *   - totalAmount: pre-calculated from TimeSlot.rate or Experience.basePrice
 *   - expiresAt: now + 24h
 *   - sessionToken: auto-generated cuid (set as HttpOnly cookie)
 *
 * Returns: { bookingId: string }
 * Sets cookie: booking_session=<sessionToken>; HttpOnly; Secure; SameSite=Lax; Max-Age=86400
 *
 * Authentication: PUBLIC (anonymous booking)
 *
 * AC-5b: Does NOT increment TimeSlot.spotsBooked — capacity reserved at payment only.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { experienceId, timeSlotId } = body as Record<string, unknown>;

  if (!experienceId || typeof experienceId !== 'string') {
    return NextResponse.json({ error: 'experienceId is required' }, { status: 400 });
  }
  if (!timeSlotId || typeof timeSlotId !== 'string') {
    return NextResponse.json({ error: 'timeSlotId is required' }, { status: 400 });
  }

  // Validate experience exists and is ACTIVE
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: {
      id: true,
      status: true,
      capacity: true,
      basePrice: true,
      baseCurrency: true,
    },
  });

  if (!experience) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }
  if (experience.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Experience is not available for booking' }, { status: 422 });
  }

  // Validate time slot exists, belongs to this experience, is in the future, has capacity
  const slot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
    select: {
      id: true,
      experienceId: true,
      startDateTime: true,
      capacity: true,
      spotsBooked: true,
      rate: true,
      currency: true,
      status: true,
    },
  });

  if (!slot) {
    return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });
  }
  if (slot.experienceId !== experienceId) {
    return NextResponse.json({ error: 'Time slot does not belong to this experience' }, { status: 422 });
  }
  if (new Date(slot.startDateTime) <= new Date()) {
    return NextResponse.json({ error: 'Time slot is in the past' }, { status: 422 });
  }
  if (slot.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Time slot is cancelled' }, { status: 422 });
  }

  const spotsRemaining = slot.capacity - slot.spotsBooked;
  if (spotsRemaining <= 0) {
    return NextResponse.json({ error: 'Time slot is fully booked', code: 'SLOT_FULL' }, { status: 409 });
  }

  // Pre-calculate total amount placeholder (1 participant at slot rate or base price)
  const unitRate = slot.rate ?? experience.basePrice;
  const currency = slot.rate ? slot.currency : experience.baseCurrency;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // AC-5b: No spotsBooked increment here — capacity reserved at payment confirmation only
  const draft = await prisma.bookingDraft.create({
    data: {
      experienceId,
      timeSlotId,
      status: 'DRAFT',
      totalAmount: unitRate, // placeholder for 1 participant; updated at step 2
      currency: currency.toString(),
      expiresAt,
    },
    select: {
      id: true,
      sessionToken: true,
    },
  });

  const response = NextResponse.json({ bookingId: draft.id }, { status: 201 });

  // Set HttpOnly session cookie
  response.cookies.set('booking_session', draft.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400, // 24h
    path: '/',
  });

  return response;
}

/**
 * CC-D-01-E: GET /api/bookings/[bookingId]/confirmation
 *
 * Public (no auth required) endpoint for the booking confirmation page.
 * Returns only non-sensitive fields — no payment provider IDs, admin notes,
 * or internal tokens. The bookingId is opaque (cuid-style), making
 * URL-guessing effectively impossible.
 *
 * Response shape drives /booking-complete/[bookingId] page rendering.
 */

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

export async function GET(
  _req: Request,
  { params }: { params: { bookingId: string } }
) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  const { bookingId } = params;
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const booking = await prisma.experienceBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      numberOfParticipants: true,
      participantNames: true,
      totalAmount: true,
      currency: true,
      specialRequirements: true,
      pickupRequested: true,
      pickupAddress: true,
      createdAt: true,
      // Joined relations — non-sensitive fields only
      experience: {
        select: {
          name: true,
          meetingPointDescription: true,
          meetingPointLatitude: true,
          meetingPointLongitude: true,
          durationMinutes: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
          operator: {
            select: {
              operatorProfile: {
                select: {
                  displayName: true,
                  businessName: true,
                },
              },
              email: true,
            },
          },
        },
      },
      timeSlot: {
        select: {
          startDateTime: true,
          endDateTime: true,
        },
      },
      // Guest contact from participant User record
      participant: {
        select: {
          email: true,
          phone: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Shape the response — flatten nested relations, omit sensitive fields
  const response = {
    id: booking.id,
    bookingRef: `CC-EXP-${booking.id.slice(0, 8).toUpperCase()}`,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    numberOfParticipants: booking.numberOfParticipants,
    participantNames: booking.participantNames,
    totalAmount: booking.totalAmount.toString(),
    currency: booking.currency,
    specialRequirements: booking.specialRequirements,
    pickupRequested: booking.pickupRequested,
    pickupAddress: booking.pickupAddress,
    createdAt: booking.createdAt.toISOString(),
    experience: {
      name: booking.experience.name,
      meetingPointDescription: booking.experience.meetingPointDescription,
      meetingPointLatitude: booking.experience.meetingPointLatitude.toString(),
      meetingPointLongitude: booking.experience.meetingPointLongitude.toString(),
      durationMinutes: booking.experience.durationMinutes,
      primaryImageUrl: booking.experience.images[0]?.url ?? null,
      operator: {
        displayName: booking.experience.operator.operatorProfile?.displayName ?? null,
        businessName: booking.experience.operator.operatorProfile?.businessName ?? null,
        email: booking.experience.operator.email,
      },
    },
    timeSlot: {
      startDateTime: booking.timeSlot.startDateTime.toISOString(),
      endDateTime: booking.timeSlot.endDateTime.toISOString(),
    },
    // Guest contact (from placeholder User created at booking time)
    guestName: booking.participant.profile
      ? `${booking.participant.profile.firstName} ${booking.participant.profile.lastName}`.trim()
      : (booking.participantNames[0] ?? 'Guest'),
    guestEmail: booking.participant.email,
    guestPhone: booking.participant.phone ?? null,
  };

  return NextResponse.json(response);
}

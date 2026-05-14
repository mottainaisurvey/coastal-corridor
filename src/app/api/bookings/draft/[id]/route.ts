/**
 * GET  /api/bookings/draft/[id] — CC-D-01-B AC-2c
 * PATCH /api/bookings/draft/[id] — CC-D-01-B AC-2b
 *
 * Both endpoints are session-token-gated: the request must include the
 * booking_session cookie matching the draft's sessionToken.
 *
 * ── GET ──────────────────────────────────────────────────────────────────────
 * Returns full draft booking + joined Experience name + joined TimeSlot details.
 * Used by the booking flow page to restore state on reload.
 *
 * ── PATCH ────────────────────────────────────────────────────────────────────
 * Updates draft booking with step 2-4 data.
 * Body fields (any subset):
 *   - groupSize: number (1 ≤ groupSize ≤ min(slot.capacity - slot.spotsBooked, experience.capacity))
 *   - guestName: string
 *   - guestEmail: string (RFC 5322 basic validation)
 *   - guestPhone: string (non-empty)
 *
 * Status guard: only DRAFT status is editable. PENDING_PAYMENT or CONFIRMED
 * bookings return 409 Conflict.
 *
 * When groupSize is updated, totalAmount is recalculated.
 *
 * Authentication: PUBLIC, session-token-gated via HttpOnly cookie.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// Basic RFC 5322 email pattern
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function resolveDraft(id: string) {
  return prisma.bookingDraft.findUnique({
    where: { id },
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
      createdAt: true,
      updatedAt: true,
      experience: {
        select: {
          id: true,
          name: true,
          capacity: true,
          basePrice: true,
          baseCurrency: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
      timeSlot: {
        select: {
          id: true,
          startDateTime: true,
          endDateTime: true,
          capacity: true,
          spotsBooked: true,
          rate: true,
          currency: true,
          status: true,
        },
      },
    },
  });
}

function sessionTokenFromRequest(): string | null {
  try {
    const cookieStore = cookies();
    return cookieStore.get('booking_session')?.value ?? null;
  } catch {
    return null;
  }
}

function formatDraft(draft: NonNullable<Awaited<ReturnType<typeof resolveDraft>>>) {
  const slot = draft.timeSlot;
  const spotsRemaining = slot.capacity - slot.spotsBooked;
  const maxGroupSize = Math.min(spotsRemaining, draft.experience.capacity);

  return {
    id: draft.id,
    status: draft.status,
    groupSize: draft.groupSize,
    guestName: draft.guestName,
    guestEmail: draft.guestEmail,
    guestPhone: draft.guestPhone,
    totalAmount: draft.totalAmount ? Number(draft.totalAmount) : null,
    currency: draft.currency,
    expiresAt: draft.expiresAt,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    experience: {
      id: draft.experience.id,
      name: draft.experience.name,
      capacity: draft.experience.capacity,
      primaryImage: draft.experience.images[0]?.url ?? null,
    },
    timeSlot: {
      id: slot.id,
      startDateTime: slot.startDateTime,
      endDateTime: slot.endDateTime,
      capacity: slot.capacity,
      spotsBooked: slot.spotsBooked,
      spotsRemaining,
      maxGroupSize,
      rate: slot.rate ? Number(slot.rate) : null,
      currency: slot.currency,
      status: slot.status,
    },
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const draft = await resolveDraft(params.id);

  if (!draft) {
    return NextResponse.json({ error: 'Draft booking not found' }, { status: 404 });
  }

  // Session token guard
  const sessionToken = sessionTokenFromRequest();
  if (!sessionToken || sessionToken !== draft.sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check expiry
  if (new Date() > new Date(draft.expiresAt)) {
    return NextResponse.json({ error: 'Draft booking has expired' }, { status: 410 });
  }

  return NextResponse.json(formatDraft(draft));
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const draft = await resolveDraft(params.id);

  if (!draft) {
    return NextResponse.json({ error: 'Draft booking not found' }, { status: 404 });
  }

  // Session token guard
  const sessionToken = sessionTokenFromRequest();
  if (!sessionToken || sessionToken !== draft.sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Status guard: only DRAFT is editable
  if (draft.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Booking is no longer editable', code: 'NOT_DRAFT', status: draft.status },
      { status: 409 }
    );
  }

  // Check expiry
  if (new Date() > new Date(draft.expiresAt)) {
    return NextResponse.json({ error: 'Draft booking has expired' }, { status: 410 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { groupSize, guestName, guestEmail, guestPhone } = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // ── Validate groupSize ────────────────────────────────────────────────────
  let validatedGroupSize: number | undefined;
  if (groupSize !== undefined) {
    const gs = Number(groupSize);
    if (!Number.isInteger(gs) || gs < 1) {
      errors.groupSize = 'Group size must be a positive integer';
    } else {
      // Re-fetch slot for live capacity check (AC-4a)
      const slot = await prisma.timeSlot.findUnique({
        where: { id: draft.timeSlot.id },
        select: { capacity: true, spotsBooked: true },
      });
      if (!slot) {
        return NextResponse.json({ error: 'Time slot no longer exists' }, { status: 422 });
      }
      const spotsRemaining = slot.capacity - slot.spotsBooked;
      const maxAllowed = Math.min(spotsRemaining, draft.experience.capacity);
      if (gs > maxAllowed) {
        if (spotsRemaining <= 0) {
          return NextResponse.json(
            { error: 'Slot is no longer available', code: 'SLOT_FULL' },
            { status: 409 }
          );
        }
        errors.groupSize = `Group size cannot exceed ${maxAllowed} (${spotsRemaining} spots remaining)`;
      } else {
        validatedGroupSize = gs;
      }
    }
  }

  // ── Validate guestName ────────────────────────────────────────────────────
  let validatedGuestName: string | undefined;
  if (guestName !== undefined) {
    if (typeof guestName !== 'string' || guestName.trim().length === 0) {
      errors.guestName = 'Guest name is required';
    } else {
      validatedGuestName = guestName.trim();
    }
  }

  // ── Validate guestEmail ───────────────────────────────────────────────────
  let validatedGuestEmail: string | undefined;
  if (guestEmail !== undefined) {
    if (typeof guestEmail !== 'string' || !EMAIL_RE.test(guestEmail.trim())) {
      errors.guestEmail = 'A valid email address is required';
    } else {
      validatedGuestEmail = guestEmail.trim().toLowerCase();
    }
  }

  // ── Validate guestPhone ───────────────────────────────────────────────────
  let validatedGuestPhone: string | undefined;
  if (guestPhone !== undefined) {
    if (typeof guestPhone !== 'string' || guestPhone.trim().length === 0) {
      errors.guestPhone = 'Phone number is required';
    } else {
      validatedGuestPhone = guestPhone.trim();
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Validation failed', fields: errors }, { status: 422 });
  }

  // ── Build update payload ──────────────────────────────────────────────────
  const updateData: Record<string, unknown> = {};
  if (validatedGroupSize !== undefined) {
    updateData.groupSize = validatedGroupSize;
    // Recalculate total amount
    const unitRate = draft.timeSlot.rate ?? Number(draft.experience.basePrice);
    updateData.totalAmount = unitRate * validatedGroupSize;
    updateData.currency = draft.timeSlot.rate
      ? draft.timeSlot.currency.toString()
      : draft.experience.baseCurrency.toString();
  }
  if (validatedGuestName !== undefined) updateData.guestName = validatedGuestName;
  if (validatedGuestEmail !== undefined) updateData.guestEmail = validatedGuestEmail;
  if (validatedGuestPhone !== undefined) updateData.guestPhone = validatedGuestPhone;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = await prisma.bookingDraft.update({
    where: { id: params.id },
    data: updateData,
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
      createdAt: true,
      updatedAt: true,
      experience: {
        select: {
          id: true,
          name: true,
          capacity: true,
          basePrice: true,
          baseCurrency: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
      timeSlot: {
        select: {
          id: true,
          startDateTime: true,
          endDateTime: true,
          capacity: true,
          spotsBooked: true,
          rate: true,
          currency: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json(formatDraft(updated));
}

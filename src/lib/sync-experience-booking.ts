/**
 * CC-D-01-D: Experience Booking Owambe Sync Helper
 *
 * Implements the outbox query logic and callOwambe invocation for syncing
 * confirmed ExperienceBookings to the Owambe platform.
 *
 * Outbox pattern:
 *   - Query: status=CONFIRMED, paymentStatus=PAID, owambeBookingId IS NULL,
 *            owambeSyncAttempts < 3
 *   - On success: set owambeBookingId from response, clear owambeSyncError
 *   - On failure: increment owambeSyncAttempts, store owambeSyncError
 *   - After 3 failures: booking is excluded from future sync runs (dead-letter)
 *
 * Idempotency:
 *   - outboundIdempotencyKey is a UUID v4 set at ExperienceBooking creation time
 *   - callOwambe checks the IdempotencyCache before making the outbound call
 *   - Re-running the cron for the same booking is safe
 */

import { getPrisma } from '@/lib/db-safe';
import { callOwambe } from '@/lib/idempotency';
import { OWAMBE_EXPERIENCE_BOOKING_POST_PATH } from '@/lib/coastal-corridor.adapter';
import { randomUUID } from 'crypto';

// ── Constants ─────────────────────────────────────────────────────────────────
export const MAX_SYNC_ATTEMPTS = 3;
export const SYNC_BATCH_SIZE = 50; // max bookings per cron run

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SyncResult {
  bookingId: string;
  success: boolean;
  owambeBookingId?: string;
  error?: string;
  fromCache: boolean;
}

export interface SyncRunSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  results: SyncResult[];
  durationMs: number;
}

// ── Owambe booking payload ────────────────────────────────────────────────────
interface OwambeExperienceBookingPayload {
  cc_booking_id: string;
  experience_id: string;
  owambe_time_slot_id: string;
  number_of_participants: number;
  participant_names: string[];
  guest_email: string;
  guest_phone?: string;
  total_amount: string;
  currency: string;
  channel_commission_amount: string;
  channel_commission_percent: string;
  net_to_operator: string;
  special_requirements?: string;
  pickup_requested: boolean;
  pickup_address?: string;
  payment_status: string;
  paystack_reference?: string;
  stripe_payment_intent_id?: string;
}

interface OwambeBookingResponse {
  booking_id: string;
  cc_booking_id: string;
  status: string;
  [key: string]: unknown;
}

// ── Outbox query ──────────────────────────────────────────────────────────────
/**
 * Fetches the next batch of ExperienceBookings that need to be synced to Owambe.
 * Predicate: CONFIRMED + PAID + no owambeBookingId + attempts < MAX_SYNC_ATTEMPTS
 */
export async function getPendingSyncBookings() {
  const prisma = getPrisma();
  if (!prisma) return [];

  return prisma.experienceBooking.findMany({
    where: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      owambeBookingId: null,
      owambeSyncAttempts: { lt: MAX_SYNC_ATTEMPTS },
    },
    include: {
      participant: {
        select: {
          email: true,
          phone: true,
        },
      },
      experience: {
        select: {
          id: true,
          owambeExperienceId: true,  // CC-D-01-D-FIX: Owambe-native ID for payload
        },
      },
      timeSlot: {
        select: {
          id: true,
          owambeTimeSlotId: true,    // CC-D-01-D-FIX: Owambe-native ID for payload
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: SYNC_BATCH_SIZE,
  });
}

// ── Single booking sync ───────────────────────────────────────────────────────
/**
 * Syncs a single ExperienceBooking to Owambe.
 * Handles idempotency key generation (if not yet set) and callOwambe invocation.
 */
export async function syncBookingToOwambe(
  booking: Awaited<ReturnType<typeof getPendingSyncBookings>>[number]
): Promise<SyncResult> {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      bookingId: booking.id,
      success: false,
      error: 'Database unavailable',
      fromCache: false,
    };
  }

  // Ensure outboundIdempotencyKey is set (idempotent: set once, never changed)
  let idempotencyKey = booking.outboundIdempotencyKey;
  if (!idempotencyKey) {
    idempotencyKey = randomUUID();
    await prisma.experienceBooking.update({
      where: { id: booking.id },
      data: { outboundIdempotencyKey: idempotencyKey },
    });
  }

  // CC-D-01-D-FIX: Defensive null check for Owambe-native IDs.
  // Every ACTIVE Experience and AVAILABLE TimeSlot should have these set via
  // the inbound Owambe webhook. If null, the booking cannot be synced —
  // log a warning, increment attempts, and skip rather than calling Owambe
  // with null values which would cause an "experience not found" error.
  const owambeExperienceId = booking.experience.owambeExperienceId;
  const owambeTimeSlotId = booking.timeSlot.owambeTimeSlotId;
  if (!owambeExperienceId || !owambeTimeSlotId) {
    const missingField = !owambeExperienceId ? 'owambeExperienceId' : 'owambeTimeSlotId';
    const errorMsg = `missing Owambe-native ID: ${missingField} is null on booking ${booking.id}`;
    console.warn(`[sync-experience-booking] ${errorMsg}`);
    await prisma.experienceBooking.update({
      where: { id: booking.id },
      data: {
        owambeSyncAttempts: { increment: 1 },
        owambeSyncError: errorMsg,
        updatedAt: new Date(),
      },
    });
    return {
      bookingId: booking.id,
      success: false,
      error: errorMsg,
      fromCache: false,
    };
  }

  // Build the outbound payload using Owambe-native IDs
  const payload: OwambeExperienceBookingPayload = {
    cc_booking_id: booking.id,
    experience_id: owambeExperienceId,
    owambe_time_slot_id: owambeTimeSlotId,
    number_of_participants: booking.numberOfParticipants,
    participant_names: booking.participantNames,
    guest_email: booking.participant.email,
    guest_phone: booking.participant.phone ?? undefined,
    total_amount: booking.totalAmount.toString(),
    currency: booking.currency,
    channel_commission_amount: booking.channelCommissionAmount.toString(),
    channel_commission_percent: booking.channelCommissionPercent.toString(),
    net_to_operator: booking.netToOperator.toString(),
    special_requirements: booking.specialRequirements ?? undefined,
    pickup_requested: booking.pickupRequested,
    pickup_address: booking.pickupAddress ?? undefined,
    payment_status: 'PAID',
    paystack_reference: booking.paystackReference ?? undefined,
    stripe_payment_intent_id: booking.stripePaymentIntentId ?? undefined,
  };

  try {
    const result = await callOwambe<OwambeBookingResponse>(
      OWAMBE_EXPERIENCE_BOOKING_POST_PATH,
      {
        method: 'POST',
        idempotencyKey,
        body: payload as unknown as Record<string, unknown>,
        timeoutMs: 10_000,
      }
    );

    // Owambe returns 2xx on success; treat 4xx as permanent failures
    if (result.status >= 200 && result.status < 300) {
      const owambeBookingId = result.data.booking_id;
      await prisma.experienceBooking.update({
        where: { id: booking.id },
        data: {
          owambeBookingId,
          owambeSyncError: null,
          updatedAt: new Date(),
        },
      });
      return {
        bookingId: booking.id,
        success: true,
        owambeBookingId,
        fromCache: result.fromCache,
      };
    }

    // 4xx: permanent failure — increment attempts, store error
    const errorMsg = `Owambe returned HTTP ${result.status}: ${JSON.stringify(result.data)}`;
    await prisma.experienceBooking.update({
      where: { id: booking.id },
      data: {
        owambeSyncAttempts: { increment: 1 },
        owambeSyncError: errorMsg,
        updatedAt: new Date(),
      },
    });
    return {
      bookingId: booking.id,
      success: false,
      error: errorMsg,
      fromCache: result.fromCache,
    };
  } catch (err) {
    // Network/timeout error — increment attempts, store error
    const errorMsg = err instanceof Error ? err.message : String(err);
    await prisma.experienceBooking.update({
      where: { id: booking.id },
      data: {
        owambeSyncAttempts: { increment: 1 },
        owambeSyncError: errorMsg,
        updatedAt: new Date(),
      },
    });
    return {
      bookingId: booking.id,
      success: false,
      error: errorMsg,
      fromCache: false,
    };
  }
}

// ── Batch sync (called by cron) ───────────────────────────────────────────────
/**
 * Runs a full sync pass: queries the outbox, calls Owambe for each booking,
 * and returns a summary.
 */
export async function runOwambeSyncPass(): Promise<SyncRunSummary> {
  const start = Date.now();
  const prisma = getPrisma();

  // Count dead-lettered bookings (attempts >= MAX_SYNC_ATTEMPTS, still unsynced)
  let deadLettered = 0;
  if (prisma) {
    deadLettered = await prisma.experienceBooking.count({
      where: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        owambeBookingId: null,
        owambeSyncAttempts: { gte: MAX_SYNC_ATTEMPTS },
      },
    });
  }

  const pending = await getPendingSyncBookings();
  const results: SyncResult[] = [];

  for (const booking of pending) {
    const result = await syncBookingToOwambe(booking);
    results.push(result);
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    attempted: pending.length,
    succeeded,
    failed,
    deadLettered,
    results,
    durationMs: Date.now() - start,
  };
}

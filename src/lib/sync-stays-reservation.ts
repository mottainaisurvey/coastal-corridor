/**
 * CC-STAYS-RESERVATION-SENDER-01: Stays Reservation Owambe Sync Helper
 *
 * Implements the outbox query logic and callOwambe invocation for pushing
 * confirmed, paid Reservations to the Owambe platform.
 *
 * Outbox pattern (symmetric to sync-experience-booking.ts):
 *   - Query: status=CONFIRMED, paymentStatus=PAID, owambeReservationId IS NULL,
 *            owambeSyncAttempts < MAX_SYNC_ATTEMPTS
 *   - On 201 Created: store owambeReservationId from response; clear owambeSyncError
 *   - On 409 Conflict: refund guest via Paystack; mark FAILED; log incident
 *   - On other 4xx: increment owambeSyncAttempts, store owambeSyncError (permanent failure)
 *   - On network/timeout error: increment owambeSyncAttempts (transient; retried next cron)
 *   - After MAX_SYNC_ATTEMPTS failures: reservation excluded from future sync (dead-letter)
 *
 * Idempotency:
 *   - outboundIdempotencyKey is a UUID v4 set at first sync attempt
 *   - callOwambe checks the IdempotencyCache before making the outbound call
 *   - Re-running the cron for the same reservation is safe
 *
 * Contract reference: § 07 STAYS RESERVATIONS INBOUND + Amendment 008 snake_case wire convention
 */

import { getPrisma } from '@/lib/db-safe';
import { callOwambe } from '@/lib/idempotency';
import { OWAMBE_RESERVATION_POST_PATH } from '@/lib/coastal-corridor.adapter';
import { validateSyncQueueEntry, type SyncQueueEntryPayload } from '@/lib/sync-queue-validation';
import { randomUUID } from 'crypto';

// ── Constants ─────────────────────────────────────────────────────────────────
export const MAX_SYNC_ATTEMPTS = 3;
export const SYNC_BATCH_SIZE = 50; // max reservations per cron run

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ReservationSyncResult {
  reservationId: string;
  success: boolean;
  owambeReservationId?: string;
  error?: string;
  fromCache: boolean;
  conflictRefundInitiated?: boolean;
}

export interface ReservationSyncRunSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  conflictRefunds: number;
  results: ReservationSyncResult[];
  durationMs: number;
}

// ── Owambe stays reservation payload (§ 07 + Amendment 008 snake_case) ────────
/**
 * AC-2: Canonical outbound payload field names per § 07 STAYS RESERVATIONS
 * INBOUND specification + Amendment 008 snake_case wire convention.
 *
 * Field mapping (CC Prisma model → Owambe wire name):
 *   id                       → cc_reservation_id       (§ 05 idempotency key + Amendment 008 cc_ short code)
 *   property.owambePropertyId → owambe_property_id      (§ 05 + existing convention)
 *   room.owambeRoomId         → owambe_room_id          (§ 06 + existing convention)
 *   guest.owambeUserId        → guest_owambe_user_id    (§ 07 guest identity)
 *   guest.email               → guest_email             (§ 07 guest contact)
 *   guest.phone               → guest_phone             (§ 07 guest contact, optional)
 *   checkInDate               → check_in_date           (§ 07 date range)
 *   checkOutDate              → check_out_date          (§ 07 date range)
 *   numberOfGuests            → number_of_guests        (§ 07 occupancy)
 *   totalAmount               → total_amount            (§ 07 financials)
 *   currency                  → currency                (§ 07 financials)
 *   channelCommissionAmount   → channel_commission_amount   (§ 07 commission reconciliation)
 *   channelCommissionPercent  → channel_commission_percent  (§ 07 commission reconciliation)
 *   netToHost                 → net_to_host             (§ 07 commission reconciliation)
 *   specialRequests           → special_requests        (§ 07 optional)
 *   paystackReference         → paystack_reference      (§ 07 payment reference, optional)
 */
export interface OwambeStaysReservationPayload {
  cc_reservation_id: string;
  owambe_property_id: string;
  owambe_room_id: string;
  guest_owambe_user_id: string | null;
  guest_email: string;
  guest_phone?: string;
  check_in_date: string;   // ISO 8601 date string: YYYY-MM-DD
  check_out_date: string;  // ISO 8601 date string: YYYY-MM-DD
  number_of_guests: number;
  total_amount: string;
  currency: string;
  channel_commission_amount: string;
  channel_commission_percent: string;
  net_to_host: string;
  special_requests?: string;
  paystack_reference?: string;
}

interface OwambeReservationResponse {
  reservation_id: string;
  cc_reservation_id: string;
  status: string;
  [key: string]: unknown;
}

// ── Outbox query ──────────────────────────────────────────────────────────────
/**
 * Fetches the next batch of Reservations that need to be synced to Owambe.
 * Predicate: CONFIRMED + PAID + no owambeReservationId + attempts < MAX_SYNC_ATTEMPTS
 */
export async function getPendingSyncReservations() {
  const prisma = getPrisma();
  if (!prisma) return [];

  return prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      owambeReservationId: null,
      owambeSyncAttempts: { lt: MAX_SYNC_ATTEMPTS },
    },
    include: {
      property: {
        select: {
          id: true,
          owambePropertyId: true,
        },
      },
      room: {
        select: {
          id: true,
          owambeRoomId: true,
        },
      },
      guest: {
        select: {
          email: true,
          phone: true,
          owambeUserId: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: SYNC_BATCH_SIZE,
  });
}

// ── Single reservation sync ───────────────────────────────────────────────────
/**
 * Syncs a single Reservation to Owambe.
 * Handles idempotency key generation, payload construction, callOwambe invocation,
 * and 201/409/other response handling per § 07 contract specification.
 */
export async function syncReservationToOwambe(
  reservation: Awaited<ReturnType<typeof getPendingSyncReservations>>[number]
): Promise<ReservationSyncResult> {
  // ── CC-PHASE-5-3-A: Validation gate at sync queue entry ───────────────────
  // Reject diagnostic-generated synthetic values before production-bound dispatch.
  const validationPayload: SyncQueueEntryPayload = {
    event_id: reservation.id,
    event_type: 'stays_reservation_sync',
    timestamp: new Date().toISOString(),
    body: reservation,
    cc_reservation_id: reservation.id,
    owambe_property_id: reservation.property.owambePropertyId ?? undefined,
    owambe_room_id: reservation.room.owambeRoomId ?? undefined,
    guest_owambe_user_id: reservation.guest.owambeUserId ?? undefined,
  };
  const validationResult = validateSyncQueueEntry(validationPayload);
  if (!validationResult.valid) {
    console.warn('[sync-queue-validation-rejected]', {
      event_id: validationPayload.event_id,
      event_type: validationPayload.event_type,
      validation_errors: validationResult.errors,
      caller_context: {
        dispatcher: 'sync-stays-reservation',
        timestamp: new Date().toISOString(),
      },
    });
    return {
      reservationId: reservation.id,
      success: false,
      error: `Sync queue validation rejected: ${validationResult.errors.map(e => e.message).join('; ')}`,
      fromCache: false,
    };
  }
  // ── End validation gate ───────────────────────────────────────────────────

  const prisma = getPrisma();
  if (!prisma) {
    return {
      reservationId: reservation.id,
      success: false,
      error: 'Database unavailable',
      fromCache: false,
    };
  }

  // Ensure outboundIdempotencyKey is set (idempotent: set once, never changed)
  let idempotencyKey = reservation.outboundIdempotencyKey;
  if (!idempotencyKey) {
    idempotencyKey = randomUUID();
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { outboundIdempotencyKey: idempotencyKey },
    });
  }

  // Defensive null check for Owambe-native IDs.
  // Every active StayProperty and Room should have these set via inbound Owambe webhook.
  const owambePropertyId = reservation.property.owambePropertyId;
  const owambeRoomId = reservation.room.owambeRoomId;
  if (!owambePropertyId || !owambeRoomId) {
    const missingField = !owambePropertyId ? 'owambePropertyId' : 'owambeRoomId';
    const errorMsg = `missing Owambe-native ID: ${missingField} is null on reservation ${reservation.id}`;
    console.warn(`[sync-stays-reservation] ${errorMsg}`);
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        owambeSyncAttempts: { increment: 1 },
        owambeSyncError: errorMsg,
        updatedAt: new Date(),
      },
    });
    return {
      reservationId: reservation.id,
      success: false,
      error: errorMsg,
      fromCache: false,
    };
  }

  // Build the outbound payload using canonical field names (AC-2)
  const payload: OwambeStaysReservationPayload = {
    cc_reservation_id: reservation.id,
    owambe_property_id: owambePropertyId,
    owambe_room_id: owambeRoomId,
    guest_owambe_user_id: reservation.guest.owambeUserId ?? null,
    guest_email: reservation.guest.email,
    guest_phone: reservation.guest.phone ?? undefined,
    check_in_date: reservation.checkInDate.toISOString().split('T')[0],
    check_out_date: reservation.checkOutDate.toISOString().split('T')[0],
    number_of_guests: reservation.numberOfGuests,
    total_amount: reservation.totalAmount.toString(),
    currency: reservation.currency,
    channel_commission_amount: reservation.channelCommissionAmount.toString(),
    channel_commission_percent: reservation.channelCommissionPercent.toString(),
    net_to_host: reservation.netToHost.toString(),
    special_requests: reservation.specialRequests ?? undefined,
    paystack_reference: reservation.paystackReference ?? undefined,
  };

  try {
    const result = await callOwambe<OwambeReservationResponse>(
      OWAMBE_RESERVATION_POST_PATH,
      {
        method: 'POST',
        idempotencyKey,
        body: payload as unknown as Record<string, unknown>,
        timeoutMs: 10_000,
      }
    );

    // 201 Created: store owambeReservationId, clear error
    if (result.status === 201 || (result.status >= 200 && result.status < 300)) {
      const owambeReservationId = result.data.reservation_id;
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          owambeReservationId,
          owambeSyncError: null,
          updatedAt: new Date(),
        },
      });
      console.info(
        `[sync-stays-reservation] 201 Created: reservation=${reservation.id} ` +
        `owambeReservationId=${owambeReservationId} fromCache=${result.fromCache}`
      );
      return {
        reservationId: reservation.id,
        success: true,
        owambeReservationId,
        fromCache: result.fromCache,
      };
    }

    // 409 Conflict: room no longer available — refund guest, mark FAILED, log incident
    if (result.status === 409) {
      const conflictMsg = `Owambe 409 Conflict: room ${owambeRoomId} unavailable for reservation ${reservation.id}`;
      console.error(`[sync-stays-reservation] ${conflictMsg}`);

      // Initiate Paystack refund if paystackReference is available
      let refundStatus: 'initiated' | 'pending' | 'no_payment_reference' = 'no_payment_reference';
      let refundId: string | undefined;

      if (reservation.paystackReference) {
        try {
          const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
          const adapter = getPaystackAdapter();
          const refundResult = await adapter.refundTransaction(reservation.paystackReference);
          refundStatus = 'initiated';
          refundId = refundResult.refundId;
          console.info(
            `[sync-stays-reservation] 409 refund initiated: reference=${reservation.paystackReference} ` +
            `refundId=${refundId}`
          );
        } catch (refundErr) {
          refundStatus = 'pending';
          console.error(
            `[sync-stays-reservation] 409 refund initiation failed for ${reservation.paystackReference}:`,
            refundErr
          );
        }
      }

      // Mark reservation FAILED + record incident in audit log
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'FAILED' as never,
          owambeSyncAttempts: { increment: 1 },
          owambeSyncError: conflictMsg,
          updatedAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          entityType: 'Reservation',
          entityId: reservation.id,
          action: 'reservation_sync_conflict',
          metadata: JSON.stringify({
            event: 'sync_409_conflict',
            reservationId: reservation.id,
            owambePropertyId,
            owambeRoomId,
            conflictMsg,
            refundStatus,
            refundId,
            paystackReference: reservation.paystackReference,
            owambeResponse: result.data,
          }),
        },
      }).catch((err: unknown) => console.error('[sync-stays-reservation] Audit log error:', err));

      return {
        reservationId: reservation.id,
        success: false,
        error: conflictMsg,
        fromCache: result.fromCache,
        conflictRefundInitiated: refundStatus === 'initiated',
      };
    }

    // Other 4xx: permanent failure — increment attempts, store error
    const errorMsg = `Owambe returned HTTP ${result.status}: ${JSON.stringify(result.data)}`;
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        owambeSyncAttempts: { increment: 1 },
        owambeSyncError: errorMsg,
        updatedAt: new Date(),
      },
    });
    return {
      reservationId: reservation.id,
      success: false,
      error: errorMsg,
      fromCache: result.fromCache,
    };
  } catch (err) {
    // Network/timeout error — increment attempts, store error (transient; retried next cron)
    const errorMsg = err instanceof Error ? err.message : String(err);
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        owambeSyncAttempts: { increment: 1 },
        owambeSyncError: errorMsg,
        updatedAt: new Date(),
      },
    });
    return {
      reservationId: reservation.id,
      success: false,
      error: errorMsg,
      fromCache: false,
    };
  }
}

// ── Batch sync (called by cron) ───────────────────────────────────────────────
/**
 * Runs a full sync pass: queries the outbox, calls Owambe for each reservation,
 * and returns a summary.
 */
export async function runOwambeStaysSyncPass(): Promise<ReservationSyncRunSummary> {
  const start = Date.now();
  const prisma = getPrisma();

  // Count dead-lettered reservations (attempts >= MAX_SYNC_ATTEMPTS, still unsynced)
  let deadLettered = 0;
  if (prisma) {
    deadLettered = await prisma.reservation.count({
      where: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        owambeReservationId: null,
        owambeSyncAttempts: { gte: MAX_SYNC_ATTEMPTS },
      },
    });
  }

  const pending = await getPendingSyncReservations();
  const results: ReservationSyncResult[] = [];

  for (const reservation of pending) {
    const result = await syncReservationToOwambe(reservation);
    results.push(result);
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const conflictRefunds = results.filter(r => r.conflictRefundInitiated).length;

  return {
    attempted: pending.length,
    succeeded,
    failed,
    deadLettered,
    conflictRefunds,
    results,
    durationMs: Date.now() - start,
  };
}

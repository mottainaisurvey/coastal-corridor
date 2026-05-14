/**
 * PUT /api/v1/channel/experiences/{id}/time-slots
 *
 * Bulk-upserts time slots for an experience pushed from Owambe.
 * This is a full replacement of the provided time slots — existing slots
 * for the same owambeTimeSlotId are updated; new ones are created.
 *
 * Payload shape matches Owambe's CCTimeSlotsUpdate / CCTimeSlot interfaces exactly
 * (coastal-corridor.adapter.ts lines 163-177, staging branch):
 *
 *   {
 *     "slots": [
 *       {
 *         "owambeTimeSlotId": "ts_abc",
 *         "startDateTime": "2026-07-01T09:00:00Z",
 *         "endDateTime": "2026-07-01T12:00:00Z",
 *         "capacity": 12,
 *         "spotsBooked": 0,
 *         "rate": 15000,
 *         "currency": "NGN",
 *         "recurrencePattern": null,
 *         "status": "OPEN"
 *       }
 *     ]
 *   }
 *
 * Flow:
 *   1. HMAC signature verification
 *   2. Idempotency check
 *   3. Payload validation
 *   4. Confirm experience exists (by owambeExperienceId path param)
 *   5. Transactional upsert of TimeSlot records
 *   6. Cache + return 200
 *
 * Spec reference: Implementation Brief §10 / CC-C-FIX-INVENTORY-01
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest, parseBody } from '@/lib/channel-auth';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';
import { hashBody } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

// ── Interfaces — verbatim match to CCTimeSlot / CCTimeSlotsUpdate ─────────────

interface TimeSlotPayload {
  owambeTimeSlotId: string;
  startDateTime: string;   // ISO 8601
  endDateTime: string;     // ISO 8601
  capacity: number;
  spotsBooked?: number;    // Owambe sends this; CC ignores (CC owns spotsBooked)
  rate?: number | null;
  currency?: string;
  recurrencePattern?: string | null;  // RFC 5545 RRULE (camelCase per Owambe interface)
  status?: string;
}

interface TimeSlotsBody {
  slots: TimeSlotPayload[];  // Owambe wraps in "slots", not "timeSlots"
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const owambeExperienceId = params.id;
  const endpointPath = `/api/v1/channel/coastal-corridor/experiences/${owambeExperienceId}/time-slots`;

  // 1. HMAC
  const guard = await verifyChannelRequest(req);
  if (guard.error) return guard.error;
  const { rawBody, idempotencyKey } = guard;

  // 2. Idempotency
  const bodyHash = hashBody(rawBody);
  const cached = await checkIdempotencyCache(idempotencyKey, endpointPath, bodyHash);
  if (cached.hit) {
    return NextResponse.json(cached.responseBody, { status: cached.responseStatus });
  }

  // 3. Parse + validate
  const { data: body, parseError } = parseBody<Record<string, unknown>>(rawBody);
  if (parseError) return parseError;

  // Top-level: Owambe sends { slots: [...] }
  if (!Array.isArray(body.slots) || body.slots.length === 0) {
    const errResponse = { error: 'slots array is required and must not be empty' };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  const payload = body as unknown as TimeSlotsBody;

  // Validate each slot
  for (const slot of payload.slots) {
    if (!slot.owambeTimeSlotId) {
      const errResponse = { error: 'Each slot must have owambeTimeSlotId' };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
    const start = new Date(slot.startDateTime);
    const end = new Date(slot.endDateTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const errResponse = {
        error: `Invalid date in slot ${slot.owambeTimeSlotId}: startDateTime and endDateTime must be ISO 8601`,
      };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
    if (end <= start) {
      const errResponse = {
        error: `endDateTime must be after startDateTime in slot ${slot.owambeTimeSlotId}`,
      };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // 4. Confirm experience exists (by owambeExperienceId path param)
  const experience = await prisma.experience.findUnique({
    where: { owambeExperienceId },
    select: { id: true },
  });
  if (!experience) {
    const errResponse = { error: `Experience not found: ${owambeExperienceId}` };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 404, errResponse);
    return NextResponse.json(errResponse, { status: 404 });
  }

  // 5. Transactional upsert
  // Schema-vs-query verification (CC-C-FIX-INVENTORY-01 AC-2d / AC-5):
  //   TimeSlot.owambeTimeSlotId   ✓ @unique
  //   TimeSlot.experienceId       ✓ FK to Experience.id
  //   TimeSlot.startDateTime      ✓ DateTime
  //   TimeSlot.endDateTime        ✓ DateTime
  //   TimeSlot.capacity           ✓ Int
  //   TimeSlot.rate               ✓ Decimal?
  //   TimeSlot.currency           ✓ Currency enum
  //   TimeSlot.recurrencePattern  ✓ String? (camelCase in schema)
  //   TimeSlot.status             ✓ TimeSlotStatus enum
  //   TimeSlot.spotsBooked        — NOT written (CC owns this; Owambe's value ignored)

  let upsertedCount = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const slot of payload.slots) {
        await tx.timeSlot.upsert({
          where: { owambeTimeSlotId: slot.owambeTimeSlotId },
          create: {
            owambeTimeSlotId: slot.owambeTimeSlotId,
            experienceId: experience.id,
            startDateTime: new Date(slot.startDateTime),
            endDateTime: new Date(slot.endDateTime),
            capacity: slot.capacity,
            rate: slot.rate ?? null,
            currency: (slot.currency ?? 'NGN') as any,
            recurrencePattern: slot.recurrencePattern ?? null,
            status: (slot.status ?? 'OPEN') as any,
          },
          update: {
            startDateTime: new Date(slot.startDateTime),
            endDateTime: new Date(slot.endDateTime),
            capacity: slot.capacity,
            rate: slot.rate ?? null,
            currency: (slot.currency ?? 'NGN') as any,
            recurrencePattern: slot.recurrencePattern ?? null,
            status: (slot.status ?? 'OPEN') as any,
            updatedAt: new Date(),
          },
        });
        upsertedCount++;
      }
    });
  } catch (err) {
    console.error('[experiences/time-slots PUT] Transaction error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // 6. Cache + return
  const responseBody = {
    owambeExperienceId,
    updatedSlots: upsertedCount,
    effectiveAt: new Date().toISOString(),
  };
  await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 200, responseBody);
  return NextResponse.json(responseBody);
}

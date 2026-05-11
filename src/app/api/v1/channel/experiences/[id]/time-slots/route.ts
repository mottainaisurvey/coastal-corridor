/**
 * PUT /api/v1/channel/experiences/{id}/time-slots
 *
 * Bulk-upserts time slots for an experience pushed from Owambe.
 * This is a full replacement of the provided time slots — existing slots
 * for the same owambeTimeSlotId are updated; new ones are created.
 *
 * Flow:
 *   1. HMAC signature verification
 *   2. Idempotency check
 *   3. Payload validation
 *   4. Confirm experience exists
 *   5. Transactional upsert of TimeSlot records
 *   6. Cache + return 200
 *
 * Payload shape:
 *   {
 *     "time_slots": [
 *       {
 *         "owambe_time_slot_id": "ts_abc",
 *         "start_date_time": "2026-07-01T09:00:00Z",
 *         "end_date_time": "2026-07-01T12:00:00Z",
 *         "capacity": 12,
 *         "rate": 15000,
 *         "currency": "NGN",
 *         "recurrence_pattern": null,
 *         "status": "OPEN"
 *       }
 *     ]
 *   }
 *
 * Spec reference: Implementation Brief §10
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest, parseBody } from '@/lib/channel-auth';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';
import { hashBody } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

interface TimeSlotPayload {
  owambe_time_slot_id: string;
  start_date_time: string;
  end_date_time: string;
  capacity: number;
  rate?: number | null;
  currency?: string;
  recurrence_pattern?: string | null;
  status?: string;
}

interface TimeSlotsBody {
  time_slots: TimeSlotPayload[];
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

  if (!Array.isArray(body.time_slots) || body.time_slots.length === 0) {
    const errResponse = { error: 'time_slots array is required and must not be empty' };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  const payload = body as unknown as TimeSlotsBody;

  // Validate each slot
  for (const slot of payload.time_slots) {
    if (!slot.owambe_time_slot_id) {
      const errResponse = { error: 'Each time_slot must have owambe_time_slot_id' };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
    const start = new Date(slot.start_date_time);
    const end = new Date(slot.end_date_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const errResponse = {
        error: `Invalid date in time slot ${slot.owambe_time_slot_id}: start_date_time and end_date_time must be ISO 8601`,
      };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
    if (end <= start) {
      const errResponse = {
        error: `end_date_time must be after start_date_time in slot ${slot.owambe_time_slot_id}`,
      };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // 4. Confirm experience exists
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
  let upsertedCount = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const slot of payload.time_slots) {
        await tx.timeSlot.upsert({
          where: { owambeTimeSlotId: slot.owambe_time_slot_id },
          create: {
            owambeTimeSlotId: slot.owambe_time_slot_id,
            experienceId: experience.id,
            startDateTime: new Date(slot.start_date_time),
            endDateTime: new Date(slot.end_date_time),
            capacity: slot.capacity,
            rate: slot.rate ?? null,
            currency: (slot.currency ?? 'NGN') as any,
            recurrencePattern: slot.recurrence_pattern ?? null,
            status: (slot.status ?? 'OPEN') as any,
          },
          update: {
            startDateTime: new Date(slot.start_date_time),
            endDateTime: new Date(slot.end_date_time),
            capacity: slot.capacity,
            rate: slot.rate ?? null,
            currency: (slot.currency ?? 'NGN') as any,
            recurrencePattern: slot.recurrence_pattern ?? null,
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
    owambe_experience_id: owambeExperienceId,
    time_slots_upserted: upsertedCount,
  };
  await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 200, responseBody);
  return NextResponse.json(responseBody);
}

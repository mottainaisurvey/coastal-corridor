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
 *     "timeSlots": [
 *       {
 *         "owambeTimeSlotId": "ts_abc",
 *         "startDateTime": "2026-07-01T09:00:00Z",
 *         "endDateTime": "2026-07-01T12:00:00Z",
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
  owambeTimeSlotId: string;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  rate?: number | null;
  currency?: string;
  recurrence_pattern?: string | null;
  status?: string;
}

interface TimeSlotsBody {
  timeSlots: TimeSlotPayload[];
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

  if (!Array.isArray(body.timeSlots) || body.timeSlots.length === 0) {
    const errResponse = { error: 'timeSlots array is required and must not be empty' };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  const payload = body as unknown as TimeSlotsBody;

  // Validate each slot
  for (const slot of payload.timeSlots) {
    if (!slot.owambeTimeSlotId) {
      const errResponse = { error: 'Each time_slot must have owambeTimeSlotId' };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
    const start = new Date(slot.startDateTime);
    const end = new Date(slot.endDateTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const errResponse = {
        error: `Invalid date in time slot ${slot.owambeTimeSlotId}: startDateTime and endDateTime must be ISO 8601`,
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
      for (const slot of payload.timeSlots) {
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
            recurrencePattern: slot.recurrence_pattern ?? null,
            status: (slot.status ?? 'OPEN') as any,
          },
          update: {
            startDateTime: new Date(slot.startDateTime),
            endDateTime: new Date(slot.endDateTime),
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
    owambeExperienceId: owambeExperienceId,
    timeSlots_upserted: upsertedCount,
  };
  await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 200, responseBody);
  return NextResponse.json(responseBody);
}

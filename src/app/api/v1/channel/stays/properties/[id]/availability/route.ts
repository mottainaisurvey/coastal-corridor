/**
 * PUT /api/v1/channel/stays/properties/{id}/availability
 *
 * Bulk-updates calendar availability for all rooms in a stay property.
 * Owambe pushes a date-range with per-room availability and rate data.
 *
 * Flow:
 *   1. HMAC signature verification
 *   2. Idempotency check
 *   3. Payload validation
 *   4. Confirm property exists
 *   5. Transactional upsert of CalendarEntry records (one per room per date)
 *   6. Cache + return 200
 *
 * Payload shape:
 *   {
 *     "rooms": [
 *       {
 *         "owambe_room_id": "room_abc",
 *         "dates": [
 *           {
 *             "date": "2026-07-01",
 *             "available": true,
 *             "rate": 45000,
 *             "currency": "NGN",
 *             "minimum_stay": 2,
 *             "maximum_stay": 14,
 *             "closed_reason": null
 *           }
 *         ]
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

interface DateEntry {
  date: string;            // ISO 8601 date string e.g. "2026-07-01"
  available: boolean;
  rate?: number | null;
  currency?: string;
  minimum_stay?: number | null;
  maximum_stay?: number | null;
  closed_reason?: string | null;
}

interface RoomAvailability {
  owambe_room_id: string;
  dates: DateEntry[];
}

interface AvailabilityPayload {
  rooms: RoomAvailability[];
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const owambePropertyId = params.id;
  const endpointPath = `/api/v1/channel/stays/properties/${owambePropertyId}/availability`;

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

  if (!Array.isArray(body.rooms) || body.rooms.length === 0) {
    const errResponse = { error: 'rooms array is required and must not be empty' };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  const payload = body as unknown as AvailabilityPayload;

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // 4. Confirm property exists
  const property = await prisma.stayProperty.findUnique({
    where: { owambePropertyId },
    select: { id: true },
  });
  if (!property) {
    const errResponse = { error: `Property not found: ${owambePropertyId}` };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 404, errResponse);
    return NextResponse.json(errResponse, { status: 404 });
  }

  // 5. Transactional upsert of CalendarEntry records
  let totalUpdated = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const roomAvail of payload.rooms) {
        // Resolve room by owambeRoomId (must belong to this property)
        const room = await tx.room.findFirst({
          where: {
            owambeRoomId: roomAvail.owambe_room_id,
            propertyId: property.id,
          },
          select: { id: true },
        });
        if (!room) {
          throw new Error(`Room not found: ${roomAvail.owambe_room_id}`);
        }

        for (const entry of roomAvail.dates) {
          const dateObj = new Date(entry.date);
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date: ${entry.date}`);
          }

          await tx.calendarEntry.upsert({
            where: { roomId_date: { roomId: room.id, date: dateObj } },
            create: {
              roomId: room.id,
              date: dateObj,
              available: entry.available,
              rate: entry.rate ?? null,
              currency: (entry.currency ?? 'NGN') as any,
              minimumStay: entry.minimum_stay ?? null,
              maximumStay: entry.maximum_stay ?? null,
              closedReason: entry.closed_reason ?? null,
            },
            update: {
              available: entry.available,
              rate: entry.rate ?? null,
              currency: (entry.currency ?? 'NGN') as any,
              minimumStay: entry.minimum_stay ?? null,
              maximumStay: entry.maximum_stay ?? null,
              closedReason: entry.closed_reason ?? null,
              updatedAt: new Date(),
            },
          });
          totalUpdated++;
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Distinguish validation errors (room not found, bad date) from DB errors
    if (message.startsWith('Room not found') || message.startsWith('Invalid date')) {
      const errResponse = { error: message };
      await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }
    console.error('[stays/availability PUT] Transaction error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // 6. Cache + return
  const responseBody = {
    owambe_property_id: owambePropertyId,
    calendar_entries_updated: totalUpdated,
  };
  await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 200, responseBody);
  return NextResponse.json(responseBody);
}

/**
 * POST /api/v1/channel/stays/properties
 *
 * Registers a new stay property pushed from Owambe.
 *
 * Flow:
 *   1. HMAC signature verification
 *   2. Idempotency check (return cached response if duplicate key)
 *   3. Payload validation
 *   4. Business validation (host user must exist)
 *   5. Transactional upsert: StayProperty + Rooms
 *   6. Cache response for idempotency
 *   7. Return 201 with created property ID
 *
 * Spec reference: Implementation Brief §10, OpenAPI spec §stays/properties
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest, parseBody } from '@/lib/channel-auth';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';
import { hashBody } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

const ENDPOINT_PATH = '/api/v1/channel/stays/properties';

// ─── Payload types ────────────────────────────────────────────────────────────

interface RoomPayload {
  owambe_room_id: string;
  name: string;
  room_type: string;
  capacity: number;
  base_rate: number;
  base_currency?: string;
  amenities?: string[];
}

interface StayPropertyPayload {
  owambe_property_id: string;
  host_user_id: string;
  name: string;
  description: string;
  property_type: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country?: string;
  latitude: number;
  longitude: number;
  amenities?: string[];
  policies?: Record<string, unknown>;
  rooms?: RoomPayload[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof StayPropertyPayload)[] = [
  'owambe_property_id',
  'host_user_id',
  'name',
  'description',
  'property_type',
  'address_line1',
  'city',
  'state',
  'latitude',
  'longitude',
];

function validatePayload(
  body: Record<string, unknown>
): { valid: true; data: StayPropertyPayload } | { valid: false; error: string } {
  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
    return { valid: false, error: 'latitude and longitude must be numbers' };
  }
  return { valid: true, data: body as unknown as StayPropertyPayload };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. HMAC verification
  const guard = await verifyChannelRequest(req);
  if (guard.error) return guard.error;
  const { rawBody, idempotencyKey } = guard;

  // 2. Idempotency check
  const bodyHash = hashBody(rawBody);
  const cached = await checkIdempotencyCache(idempotencyKey, ENDPOINT_PATH, bodyHash);
  if (cached.hit) {
    return NextResponse.json(cached.responseBody, { status: cached.responseStatus });
  }

  // 3. Parse + validate body
  const { data: body, parseError } = parseBody<Record<string, unknown>>(rawBody);
  if (parseError) return parseError;

  const validation = validatePayload(body);
  if (!validation.valid) {
    const errResponse = { error: validation.error };
    await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }
  const payload = validation.data;

  // 4. Business validation — host user must exist
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const hostUser = await prisma.user.findUnique({
    where: { id: payload.host_user_id },
    select: { id: true },
  });
  if (!hostUser) {
    const errResponse = { error: `Host user not found: ${payload.host_user_id}` };
    await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  // 5. Transactional upsert: StayProperty + Rooms
  let property: { id: string; owambePropertyId: string };
  try {
    property = await prisma.$transaction(async (tx) => {
      const created = await tx.stayProperty.upsert({
        where: { owambePropertyId: payload.owambe_property_id },
        create: {
          owambePropertyId: payload.owambe_property_id,
          hostUserId: payload.host_user_id,
          name: payload.name,
          description: payload.description,
          propertyType: payload.property_type as any,
          addressLine1: payload.address_line1,
          addressLine2: payload.address_line2 ?? null,
          city: payload.city,
          state: payload.state,
          country: payload.country ?? 'Nigeria',
          latitude: payload.latitude,
          longitude: payload.longitude,
          amenities: payload.amenities ?? [],
          policies: payload.policies ?? {},
          status: 'UNDER_REVIEW',
        },
        update: {
          name: payload.name,
          description: payload.description,
          propertyType: payload.property_type as any,
          addressLine1: payload.address_line1,
          addressLine2: payload.address_line2 ?? null,
          city: payload.city,
          state: payload.state,
          country: payload.country ?? 'Nigeria',
          latitude: payload.latitude,
          longitude: payload.longitude,
          amenities: payload.amenities ?? [],
          policies: payload.policies ?? {},
          updatedAt: new Date(),
        },
        select: { id: true, owambePropertyId: true },
      });

      // Upsert rooms if provided
      if (payload.rooms && payload.rooms.length > 0) {
        for (const room of payload.rooms) {
          await tx.room.upsert({
            where: { owambeRoomId: room.owambe_room_id },
            create: {
              owambeRoomId: room.owambe_room_id,
              propertyId: created.id,
              name: room.name,
              roomType: room.room_type as any,
              capacity: room.capacity,
              baseRate: room.base_rate,
              baseCurrency: (room.base_currency ?? 'NGN') as any,
              amenities: room.amenities ?? [],
            },
            update: {
              name: room.name,
              roomType: room.room_type as any,
              capacity: room.capacity,
              baseRate: room.base_rate,
              baseCurrency: (room.base_currency ?? 'NGN') as any,
              amenities: room.amenities ?? [],
              updatedAt: new Date(),
            },
          });
        }
      }

      return created;
    });
  } catch (err) {
    console.error('[stays/properties POST] Transaction error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // 6. Cache + return 201
  const responseBody = {
    id: property.id,
    owambe_property_id: property.owambePropertyId,
    status: 'UNDER_REVIEW',
  };
  await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 201, responseBody);
  return NextResponse.json(responseBody, { status: 201 });
}

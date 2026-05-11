/**
 * POST /api/v1/channel/stays/properties
 *
 * Registers a new stay property pushed from Owambe.
 *
 * Flow:
 *   1. HMAC signature verification
 *   2. Idempotency check (return cached response if duplicate key)
 *   3. Payload validation
 *   4. Host find-or-create
 *      a. Look up User by owambeUserId = host_owambe_user_id
 *      b. If not found: validate cohort_code, create User + mark code USED
 *   5. Transactional upsert: StayProperty + Rooms
 *   6. Cache response for idempotency
 *   7. Return 201 with created property ID
 *
 * Spec reference: Implementation Brief §02 (cohort model), §10 (channel API)
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest, parseBody } from '@/lib/channel-auth';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';
import { hashBody } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

const ENDPOINT_PATH = '/api/v1/channel/coastal-corridor/properties';

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
  host_owambe_user_id: string;
  cohort_code?: string;
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
  'host_owambe_user_id',
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

  // 4. Host find-or-create
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // 4a. Look up existing user by Owambe user ID
  let hostUser = await prisma.user.findUnique({
    where: { owambeUserId: payload.host_owambe_user_id },
    select: { id: true },
  });

  // 4b. Auto-create if not found — requires a valid cohort code
  if (!hostUser) {
    if (!payload.cohort_code) {
      const errResponse = {
        error: `Host user not found for owambe_user_id: ${payload.host_owambe_user_id}. Provide cohort_code to auto-register.`,
      };
      await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }

    // Validate the cohort code
    const cohortRecord = await prisma.cohortCode.findUnique({
      where: { code: payload.cohort_code },
    });

    if (!cohortRecord) {
      const errResponse = { error: `Cohort code not found: ${payload.cohort_code}` };
      await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }

    if (cohortRecord.status !== 'ACTIVE') {
      const errResponse = {
        error: `Cohort code ${payload.cohort_code} is not active (status: ${cohortRecord.status})`,
      };
      await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }

    if (cohortRecord.expiresAt && cohortRecord.expiresAt < new Date()) {
      const errResponse = { error: `Cohort code ${payload.cohort_code} has expired` };
      await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }

    if (
      cohortRecord.cohortType !== 'COASTAL_CORRIDOR_HOST' &&
      cohortRecord.cohortType !== 'BOTH'
    ) {
      const errResponse = {
        error: `Cohort code ${payload.cohort_code} does not grant HOST access (type: ${cohortRecord.cohortType})`,
      };
      await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
      return NextResponse.json(errResponse, { status: 422 });
    }

    // Create the User and mark the cohort code as USED — both inside a transaction
    const syntheticEmail = `owambe-${payload.host_owambe_user_id}@channel.coastal-corridor.internal`;
    try {
      const created = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: syntheticEmail,
            role: 'HOST',
            status: 'ACTIVE',
            owambeUserId: payload.host_owambe_user_id,
            cohortMember: true,
            cohortCode: cohortRecord.code,
            cohortType: cohortRecord.cohortType,
            cohortStartDate: cohortRecord.issuedAt,
            cohortEndDate: cohortRecord.expiresAt ?? null,
          },
          select: { id: true },
        });
        await tx.cohortCode.update({
          where: { code: cohortRecord.code },
          data: {
            status: 'USED',
            usedByUserId: newUser.id,
            usedAt: new Date(),
          },
        });
        return newUser;
      });
      hostUser = created;
    } catch (err: unknown) {
      // Handle race condition: another request created the user between our findUnique and create
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        // Unique constraint violation — user was just created by a concurrent request
        hostUser = await prisma.user.findUnique({
          where: { owambeUserId: payload.host_owambe_user_id },
          select: { id: true },
        });
        if (!hostUser) {
          console.error('[stays/properties POST] Race condition: user still not found after P2002');
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
      } else {
        console.error('[stays/properties POST] Host auto-creation error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
  }

  const hostUserId = hostUser.id;

  // 5. Transactional upsert: StayProperty + Rooms
  let property: { id: string; owambePropertyId: string };
  try {
    property = await prisma.$transaction(async (tx) => {
      const created = await tx.stayProperty.upsert({
        where: { owambePropertyId: payload.owambe_property_id },
        create: {
          owambePropertyId: payload.owambe_property_id,
          hostUserId,
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

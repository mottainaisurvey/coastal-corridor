/**
 * POST /api/v1/channel/experiences/inventory
 *
 * Registers a new experience pushed from Owambe.
 *
 * Flow:
 *   1. HMAC signature verification
 *   2. Idempotency check
 *   3. Payload validation
 *   4. Business validation (operator user must exist)
 *   5. Transactional upsert: Experience
 *   6. Cache + return 201
 *
 * Spec reference: Implementation Brief §10
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest, parseBody } from '@/lib/channel-auth';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';
import { hashBody } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

const ENDPOINT_PATH = '/api/v1/channel/experiences/inventory';

interface ExperiencePayload {
  owambe_experience_id: string;
  operator_user_id: string;
  name: string;
  description: string;
  experience_type: string;
  duration_minutes: number;
  capacity: number;
  meeting_point_description: string;
  meeting_point_latitude: number;
  meeting_point_longitude: number;
  pricing_model: string;
  base_price: number;
  base_currency?: string;
  age_restriction?: string | null;
  fitness_requirement?: string | null;
  weather_dependent?: boolean;
  equipment_provided?: string[];
  equipment_required?: string[];
}

const REQUIRED_FIELDS: (keyof ExperiencePayload)[] = [
  'owambe_experience_id',
  'operator_user_id',
  'name',
  'description',
  'experience_type',
  'duration_minutes',
  'capacity',
  'meeting_point_description',
  'meeting_point_latitude',
  'meeting_point_longitude',
  'pricing_model',
  'base_price',
];

function validatePayload(
  body: Record<string, unknown>
): { valid: true; data: ExperiencePayload } | { valid: false; error: string } {
  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  if (
    typeof body.meeting_point_latitude !== 'number' ||
    typeof body.meeting_point_longitude !== 'number'
  ) {
    return {
      valid: false,
      error: 'meeting_point_latitude and meeting_point_longitude must be numbers',
    };
  }
  if (typeof body.duration_minutes !== 'number' || body.duration_minutes <= 0) {
    return { valid: false, error: 'duration_minutes must be a positive number' };
  }
  if (typeof body.capacity !== 'number' || body.capacity <= 0) {
    return { valid: false, error: 'capacity must be a positive number' };
  }
  if (typeof body.base_price !== 'number' || body.base_price < 0) {
    return { valid: false, error: 'base_price must be a non-negative number' };
  }
  return { valid: true, data: body as unknown as ExperiencePayload };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. HMAC
  const guard = await verifyChannelRequest(req);
  if (guard.error) return guard.error;
  const { rawBody, idempotencyKey } = guard;

  // 2. Idempotency
  const bodyHash = hashBody(rawBody);
  const cached = await checkIdempotencyCache(idempotencyKey, ENDPOINT_PATH, bodyHash);
  if (cached.hit) {
    return NextResponse.json(cached.responseBody, { status: cached.responseStatus });
  }

  // 3. Parse + validate
  const { data: body, parseError } = parseBody<Record<string, unknown>>(rawBody);
  if (parseError) return parseError;

  const validation = validatePayload(body);
  if (!validation.valid) {
    const errResponse = { error: validation.error };
    await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }
  const payload = validation.data;

  // 4. Business validation — operator user must exist
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const operatorUser = await prisma.user.findUnique({
    where: { id: payload.operator_user_id },
    select: { id: true },
  });
  if (!operatorUser) {
    const errResponse = { error: `Operator user not found: ${payload.operator_user_id}` };
    await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  // 5. Transactional upsert
  let experience: { id: string; owambeExperienceId: string };
  try {
    experience = await prisma.$transaction(async (tx) => {
      return tx.experience.upsert({
        where: { owambeExperienceId: payload.owambe_experience_id },
        create: {
          owambeExperienceId: payload.owambe_experience_id,
          operatorUserId: payload.operator_user_id,
          name: payload.name,
          description: payload.description,
          experienceType: payload.experience_type as any,
          durationMinutes: payload.duration_minutes,
          capacity: payload.capacity,
          meetingPointDescription: payload.meeting_point_description,
          meetingPointLatitude: payload.meeting_point_latitude,
          meetingPointLongitude: payload.meeting_point_longitude,
          pricingModel: payload.pricing_model as any,
          basePrice: payload.base_price,
          baseCurrency: (payload.base_currency ?? 'NGN') as any,
          ageRestriction: payload.age_restriction ?? null,
          fitnessRequirement: payload.fitness_requirement ?? null,
          weatherDependent: payload.weather_dependent ?? false,
          equipmentProvided: payload.equipment_provided ?? [],
          equipmentRequired: payload.equipment_required ?? [],
          status: 'UNDER_REVIEW',
        },
        update: {
          name: payload.name,
          description: payload.description,
          experienceType: payload.experience_type as any,
          durationMinutes: payload.duration_minutes,
          capacity: payload.capacity,
          meetingPointDescription: payload.meeting_point_description,
          meetingPointLatitude: payload.meeting_point_latitude,
          meetingPointLongitude: payload.meeting_point_longitude,
          pricingModel: payload.pricing_model as any,
          basePrice: payload.base_price,
          baseCurrency: (payload.base_currency ?? 'NGN') as any,
          ageRestriction: payload.age_restriction ?? null,
          fitnessRequirement: payload.fitness_requirement ?? null,
          weatherDependent: payload.weather_dependent ?? false,
          equipmentProvided: payload.equipment_provided ?? [],
          equipmentRequired: payload.equipment_required ?? [],
          updatedAt: new Date(),
        },
        select: { id: true, owambeExperienceId: true },
      });
    });
  } catch (err) {
    console.error('[experiences/inventory POST] Transaction error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // 6. Cache + return 201
  const responseBody = {
    id: experience.id,
    owambe_experience_id: experience.owambeExperienceId,
    status: 'UNDER_REVIEW',
  };
  await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 201, responseBody);
  return NextResponse.json(responseBody, { status: 201 });
}

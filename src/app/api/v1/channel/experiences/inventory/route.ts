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

const ENDPOINT_PATH = '/api/v1/channel/coastal-corridor/experiences/inventory';

interface ExperiencePayload {
  owambeExperienceId: string;
  operatorUserId: string;
  name: string;
  description: string;
  experienceType: string;
  durationMinutes: number;
  capacity: number;
  meetingPointDescription: string;
  meetingPointLatitude: number;
  meetingPointLongitude: number;
  pricing_model: string;
  basePrice: number;
  baseCurrency?: string;
  age_restriction?: string | null;
  fitness_requirement?: string | null;
  weather_dependent?: boolean;
  equipment_provided?: string[];
  equipment_required?: string[];
}

const REQUIRED_FIELDS: (keyof ExperiencePayload)[] = [
  'owambeExperienceId',
  'operatorUserId',
  'name',
  'description',
  'experienceType',
  'durationMinutes',
  'capacity',
  'meetingPointDescription',
  'meetingPointLatitude',
  'meetingPointLongitude',
  'pricing_model',
  'basePrice',
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
    typeof body.meetingPointLatitude !== 'number' ||
    typeof body.meetingPointLongitude !== 'number'
  ) {
    return {
      valid: false,
      error: 'meetingPointLatitude and meetingPointLongitude must be numbers',
    };
  }
  if (typeof body.durationMinutes !== 'number' || body.durationMinutes <= 0) {
    return { valid: false, error: 'durationMinutes must be a positive number' };
  }
  if (typeof body.capacity !== 'number' || body.capacity <= 0) {
    return { valid: false, error: 'capacity must be a positive number' };
  }
  if (typeof body.basePrice !== 'number' || body.basePrice < 0) {
    return { valid: false, error: 'basePrice must be a non-negative number' };
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
    where: { id: payload.operatorUserId },
    select: { id: true },
  });
  if (!operatorUser) {
    const errResponse = { error: `Operator user not found: ${payload.operatorUserId}` };
    await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  // 5. Transactional upsert
  let experience: { id: string; owambeExperienceId: string };
  try {
    experience = await prisma.$transaction(async (tx) => {
      return tx.experience.upsert({
        where: { owambeExperienceId: payload.owambeExperienceId },
        create: {
          owambeExperienceId: payload.owambeExperienceId,
          operatorUserId: payload.operatorUserId,
          name: payload.name,
          description: payload.description,
          experienceType: payload.experienceType as any,
          durationMinutes: payload.durationMinutes,
          capacity: payload.capacity,
          meetingPointDescription: payload.meetingPointDescription,
          meetingPointLatitude: payload.meetingPointLatitude,
          meetingPointLongitude: payload.meetingPointLongitude,
          pricingModel: payload.pricing_model as any,
          basePrice: payload.basePrice,
          baseCurrency: (payload.baseCurrency ?? 'NGN') as any,
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
          experienceType: payload.experienceType as any,
          durationMinutes: payload.durationMinutes,
          capacity: payload.capacity,
          meetingPointDescription: payload.meetingPointDescription,
          meetingPointLatitude: payload.meetingPointLatitude,
          meetingPointLongitude: payload.meetingPointLongitude,
          pricingModel: payload.pricing_model as any,
          basePrice: payload.basePrice,
          baseCurrency: (payload.baseCurrency ?? 'NGN') as any,
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
    owambeExperienceId: experience.owambeExperienceId,
    status: 'UNDER_REVIEW',
  };
  await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 201, responseBody);
  return NextResponse.json(responseBody, { status: 201 });
}

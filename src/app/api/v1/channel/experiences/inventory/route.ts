/**
 * POST /api/v1/channel/experiences/inventory
 *
 * Registers a new experience pushed from Owambe.
 *
 * Payload shape matches Owambe's CCExperienceRegistration interface exactly
 * (coastal-corridor.adapter.ts lines 134-153, staging branch).
 *
 * Flow:
 *   1. HMAC signature verification
 *   2. Idempotency check
 *   3. Payload validation
 *   4. Business validation (operator user must exist via operatorOwambeUserId)
 *   5. Transactional upsert: Experience
 *   6. Cache + return 201
 *
 * Spec reference: Implementation Brief §10 / CC-C-FIX-INVENTORY-01
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest, parseBody } from '@/lib/channel-auth';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';
import { hashBody } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

const ENDPOINT_PATH = '/api/v1/channel/coastal-corridor/experiences/inventory';

// ── Nested sub-interfaces (matching Owambe's CCMeetingPoint / CCExperiencePricing) ──

interface MeetingPoint {
  description: string;
  latitude: number;
  longitude: number;
}

interface Pricing {
  model: string;
  basePrice: number;
  baseCurrency?: string;
}

// ── Top-level payload — verbatim match to CCExperienceRegistration ─────────────

interface ExperiencePayload {
  owambeExperienceId: string;
  operatorOwambeUserId: string;
  cohortMember?: boolean;
  cohortType?: string | null;
  name: string;
  description?: string;
  experienceType: string;
  durationMinutes: number;
  capacity: number;
  meetingPoint: MeetingPoint;
  pricing: Pricing;
  ageRestriction?: string | null;
  fitnessRequirement?: string | null;
  weatherDependent?: boolean;
  equipmentProvided?: string[];
  equipmentRequired?: string[];
  photos?: unknown[];
  status: string;
}

// Required fields checked at the top level (nested paths checked separately below)
const TOP_LEVEL_REQUIRED: (keyof ExperiencePayload)[] = [
  'owambeExperienceId',
  'operatorOwambeUserId',
  'name',
  'experienceType',
  'durationMinutes',
  'capacity',
  'meetingPoint',
  'pricing',
  'status',
];

function validatePayload(
  body: Record<string, unknown>
): { valid: true; data: ExperiencePayload } | { valid: false; error: string } {
  // Top-level required fields
  for (const field of TOP_LEVEL_REQUIRED) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // meetingPoint nested validation
  const mp = body.meetingPoint as Record<string, unknown> | undefined;
  if (!mp || typeof mp !== 'object') {
    return { valid: false, error: 'meetingPoint must be an object' };
  }
  if (!mp.description || typeof mp.description !== 'string') {
    return { valid: false, error: 'meetingPoint.description is required and must be a string' };
  }
  if (typeof mp.latitude !== 'number') {
    return { valid: false, error: 'meetingPoint.latitude must be a number' };
  }
  if (typeof mp.longitude !== 'number') {
    return { valid: false, error: 'meetingPoint.longitude must be a number' };
  }

  // pricing nested validation
  const pricing = body.pricing as Record<string, unknown> | undefined;
  if (!pricing || typeof pricing !== 'object') {
    return { valid: false, error: 'pricing must be an object' };
  }
  if (!pricing.model || typeof pricing.model !== 'string') {
    return { valid: false, error: 'pricing.model is required and must be a string' };
  }
  if (typeof pricing.basePrice !== 'number' || pricing.basePrice < 0) {
    return { valid: false, error: 'pricing.basePrice must be a non-negative number' };
  }

  // Scalar validations
  if (typeof body.durationMinutes !== 'number' || body.durationMinutes <= 0) {
    return { valid: false, error: 'durationMinutes must be a positive number' };
  }
  if (typeof body.capacity !== 'number' || body.capacity <= 0) {
    return { valid: false, error: 'capacity must be a positive number' };
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

  // 4. Business validation — operator user must exist (looked up by owambeUserId field on User)
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const operatorUser = await prisma.user.findUnique({
    where: { owambeUserId: payload.operatorOwambeUserId },
    select: { id: true },
  });
  if (!operatorUser) {
    const errResponse = { error: `Operator user not found: ${payload.operatorOwambeUserId}` };
    await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 422, errResponse);
    return NextResponse.json(errResponse, { status: 422 });
  }

  // 5. Transactional upsert
  // Schema-vs-query verification (CC-C-FIX-INVENTORY-01 AC-2d):
  //   Experience.owambeExperienceId   ✓ @unique
  //   Experience.operatorUserId       ✓ FK to User.id
  //   Experience.name                 ✓ String
  //   Experience.description          ✓ String @db.Text
  //   Experience.experienceType       ✓ ExperienceType enum
  //   Experience.durationMinutes      ✓ Int
  //   Experience.capacity             ✓ Int
  //   Experience.meetingPointDescription ✓ String
  //   Experience.meetingPointLatitude ✓ Decimal
  //   Experience.meetingPointLongitude ✓ Decimal
  //   Experience.pricingModel         ✓ PricingModel enum (from pricing.model)
  //   Experience.basePrice            ✓ Decimal (from pricing.basePrice)
  //   Experience.baseCurrency         ✓ Currency enum (from pricing.baseCurrency)
  //   Experience.ageRestriction       ✓ String?
  //   Experience.fitnessRequirement   ✓ String?
  //   Experience.weatherDependent     ✓ Boolean
  //   Experience.equipmentProvided    ✓ String[]
  //   Experience.equipmentRequired    ✓ String[]
  //   Experience.status               ✓ ExperienceStatus (hardcoded UNDER_REVIEW on create)

  let experience: { id: string; owambeExperienceId: string };
  try {
    experience = await prisma.$transaction(async (tx) => {
      return tx.experience.upsert({
        where: { owambeExperienceId: payload.owambeExperienceId },
        create: {
          owambeExperienceId: payload.owambeExperienceId,
          operatorUserId: operatorUser.id,
          name: payload.name,
          description: payload.description ?? '',
          experienceType: payload.experienceType as any,
          durationMinutes: payload.durationMinutes,
          capacity: payload.capacity,
          meetingPointDescription: payload.meetingPoint.description,
          meetingPointLatitude: payload.meetingPoint.latitude,
          meetingPointLongitude: payload.meetingPoint.longitude,
          pricingModel: payload.pricing.model as any,
          basePrice: payload.pricing.basePrice,
          baseCurrency: (payload.pricing.baseCurrency ?? 'NGN') as any,
          ageRestriction: payload.ageRestriction ?? null,
          fitnessRequirement: payload.fitnessRequirement ?? null,
          weatherDependent: payload.weatherDependent ?? false,
          equipmentProvided: payload.equipmentProvided ?? [],
          equipmentRequired: payload.equipmentRequired ?? [],
          status: 'UNDER_REVIEW',
        },
        update: {
          operatorUserId: operatorUser.id,
          name: payload.name,
          description: payload.description ?? '',
          experienceType: payload.experienceType as any,
          durationMinutes: payload.durationMinutes,
          capacity: payload.capacity,
          meetingPointDescription: payload.meetingPoint.description,
          meetingPointLatitude: payload.meetingPoint.latitude,
          meetingPointLongitude: payload.meetingPoint.longitude,
          pricingModel: payload.pricing.model as any,
          basePrice: payload.pricing.basePrice,
          baseCurrency: (payload.pricing.baseCurrency ?? 'NGN') as any,
          ageRestriction: payload.ageRestriction ?? null,
          fitnessRequirement: payload.fitnessRequirement ?? null,
          weatherDependent: payload.weatherDependent ?? false,
          equipmentProvided: payload.equipmentProvided ?? [],
          equipmentRequired: payload.equipmentRequired ?? [],
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
    coastalCorridorExperienceId: experience.id,
    owambeExperienceId: experience.owambeExperienceId,
    status: 'UNDER_REVIEW',
    listingUrl: `/experiences/${experience.id}`,
    createdAt: new Date().toISOString(),
  };
  await storeIdempotencyResponse(idempotencyKey, ENDPOINT_PATH, bodyHash, 201, responseBody);
  return NextResponse.json(responseBody, { status: 201 });
}

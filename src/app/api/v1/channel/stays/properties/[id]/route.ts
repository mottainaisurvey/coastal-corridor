/**
 * PATCH /api/v1/channel/stays/properties/{id}
 * DELETE /api/v1/channel/stays/properties/{id}
 *
 * PATCH — Updates an existing stay property (partial update by owambe_property_id).
 * DELETE — Soft-deletes a stay property by setting status to INACTIVE.
 *
 * Both endpoints:
 *   1. Verify HMAC signature
 *   2. Check idempotency cache
 *   3. Validate payload / params
 *   4. Perform transactional DB operation
 *   5. Cache and return response
 *
 * Spec reference: Implementation Brief §10
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest, parseBody } from '@/lib/channel-auth';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';
import { hashBody } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const owambePropertyId = params.id;
  const endpointPath = `/api/v1/channel/stays/properties/${owambePropertyId}`;

  const guard = await verifyChannelRequest(req);
  if (guard.error) return guard.error;
  const { rawBody, idempotencyKey } = guard;

  const bodyHash = hashBody(rawBody);
  const cached = await checkIdempotencyCache(idempotencyKey, endpointPath, bodyHash);
  if (cached.hit) {
    return NextResponse.json(cached.responseBody, { status: cached.responseStatus });
  }

  const { data: body, parseError } = parseBody<Record<string, unknown>>(rawBody);
  if (parseError) return parseError;

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Confirm property exists
  const existing = await prisma.stayProperty.findUnique({
    where: { owambePropertyId },
    select: { id: true },
  });
  if (!existing) {
    const errResponse = { error: `Property not found: ${owambePropertyId}` };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 404, errResponse);
    return NextResponse.json(errResponse, { status: 404 });
  }

  // Build partial update — only update fields present in the payload
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    property_type: 'propertyType',
    address_line1: 'addressLine1',
    address_line2: 'addressLine2',
    city: 'city',
    state: 'state',
    country: 'country',
    latitude: 'latitude',
    longitude: 'longitude',
    amenities: 'amenities',
    policies: 'policies',
  };
  for (const [payloadKey, dbKey] of Object.entries(fieldMap)) {
    if (body[payloadKey] !== undefined) {
      updateData[dbKey] = body[payloadKey];
    }
  }

  try {
    const updated = await prisma.stayProperty.update({
      where: { owambePropertyId },
      data: updateData,
      select: { id: true, owambePropertyId: true, status: true, updatedAt: true },
    });

    const responseBody = {
      id: updated.id,
      owambe_property_id: updated.owambePropertyId,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 200, responseBody);
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('[stays/properties PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const owambePropertyId = params.id;
  const endpointPath = `/api/v1/channel/stays/properties/${owambePropertyId}`;

  // DELETE requests may have no body — use empty string for HMAC + idempotency
  const guard = await verifyChannelRequest(req);
  if (guard.error) return guard.error;
  const { rawBody, idempotencyKey } = guard;

  const bodyHash = hashBody(rawBody || '');
  const cached = await checkIdempotencyCache(idempotencyKey, endpointPath, bodyHash);
  if (cached.hit) {
    return NextResponse.json(cached.responseBody, { status: cached.responseStatus });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const existing = await prisma.stayProperty.findUnique({
    where: { owambePropertyId },
    select: { id: true },
  });
  if (!existing) {
    const errResponse = { error: `Property not found: ${owambePropertyId}` };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 404, errResponse);
    return NextResponse.json(errResponse, { status: 404 });
  }

  try {
    // Soft delete — set status to INACTIVE
    await prisma.stayProperty.update({
      where: { owambePropertyId },
      data: { status: 'INACTIVE', updatedAt: new Date() },
    });

    const responseBody = { deleted: true, owambe_property_id: owambePropertyId };
    await storeIdempotencyResponse(idempotencyKey, endpointPath, bodyHash, 200, responseBody);
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('[stays/properties DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

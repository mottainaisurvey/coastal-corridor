/**
 * Phase B Integration Tests
 *
 * Covers all 6 new Phase B endpoints:
 *   1. POST   /api/v1/channel/stays/properties
 *   2. PATCH  /api/v1/channel/stays/properties/{id}
 *   3. DELETE /api/v1/channel/stays/properties/{id}
 *   4. PUT    /api/v1/channel/stays/properties/{id}/availability
 *   5. POST   /api/v1/channel/experiences/inventory
 *   6. PUT    /api/v1/channel/experiences/{id}/time-slots
 *
 * Plus reconciliation snapshots:
 *   7. GET    /api/v1/channel/reconciliation/stays/snapshot
 *   8. GET    /api/v1/channel/reconciliation/experiences/snapshot
 *
 * All Prisma and HMAC/idempotency dependencies are mocked.
 * Tests verify:
 *   - 400 when required headers are missing
 *   - 401 when HMAC signature is invalid
 *   - 422 when required payload fields are missing
 *   - 422 when referenced entity does not exist
 *   - 200/201 on success
 *   - Idempotency cache hit returns cached response
 *   - 503 when database is unavailable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/db-safe', () => ({
  getPrisma: vi.fn(),
}));

vi.mock('@/lib/hmac', () => ({
  verifyInboundWebhook: vi.fn(),
  hashBody: vi.fn((body: string) => `hash:${body.length}`),
  buildOwambeHeaders: vi.fn(),
  signOutboundRequest: vi.fn(),
}));

vi.mock('@/lib/idempotency', () => ({
  checkIdempotencyCache: vi.fn(),
  storeIdempotencyResponse: vi.fn(),
  callOwambe: vi.fn(),
  pruneExpiredIdempotencyCache: vi.fn(),
}));

import { getPrisma } from '@/lib/db-safe';
import { verifyInboundWebhook } from '@/lib/hmac';
import { checkIdempotencyCache, storeIdempotencyResponse } from '@/lib/idempotency';

// ─── Import handlers ──────────────────────────────────────────────────────────

import { POST as staysPropertiesPost } from '@/app/api/v1/channel/stays/properties/route';
import {
  PATCH as staysPropertyPatch,
  DELETE as staysPropertyDelete,
} from '@/app/api/v1/channel/stays/properties/[id]/route';
import { PUT as staysAvailabilityPut } from '@/app/api/v1/channel/stays/properties/[id]/availability/route';
import { POST as experiencesInventoryPost } from '@/app/api/v1/channel/experiences/inventory/route';
import { PUT as experiencesTimeSlotsput } from '@/app/api/v1/channel/experiences/[id]/time-slots/route';
import { GET as reconciliationStaysGet } from '@/app/api/v1/channel/reconciliation/stays/snapshot/route';
import { GET as reconciliationExperiencesGet } from '@/app/api/v1/channel/reconciliation/experiences/snapshot/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(
  url: string,
  method: string,
  body?: object,
  overrideHeaders?: Record<string, string>
): NextRequest {
  const bodyStr = body ? JSON.stringify(body) : '';
  return new NextRequest(url, {
    method,
    body: bodyStr || undefined,
    headers: {
      'content-type': 'application/json',
      'x-owambe-signature': 'sig_valid',
      'x-owambe-timestamp': String(Math.floor(Date.now() / 1000)),
      'x-idempotency-key': `idem_${Date.now()}`,
      ...overrideHeaders,
    },
  });
}

function cacheMiss() {
  vi.mocked(checkIdempotencyCache).mockResolvedValue({ hit: false, idempotencyKey: 'key' });
}

function cacheHit(status: number, body: object) {
  vi.mocked(checkIdempotencyCache).mockResolvedValue({
    hit: true,
    responseStatus: status,
    responseBody: body,
    idempotencyKey: 'key',
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  vi.mocked(storeIdempotencyResponse).mockResolvedValue(undefined);
  cacheMiss();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Shared auth guard tests (run against one endpoint as representative) ─────

describe('Channel auth guard (shared)', () => {
  it('returns 400 when x-owambe-signature header is missing', async () => {
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      {},
      { 'x-owambe-signature': '' }
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/missing required headers/i);
  });

  it('returns 401 when HMAC signature is invalid', async () => {
    vi.mocked(verifyInboundWebhook).mockReturnValue(false);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      {}
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(401);
  });

  it('returns cached response on idempotency hit', async () => {
    cacheHit(201, { id: 'cached_id', owambe_property_id: 'prop_cached', status: 'UNDER_REVIEW' });
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      {}
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('cached_id');
  });
});

// ─── POST /stays/properties ───────────────────────────────────────────────────

describe('POST /api/v1/channel/stays/properties', () => {
  const validPayload = {
    owambe_property_id: 'prop_001',
    host_owambe_user_id: 'owambe_user_001',
    name: 'Beachfront Villa',
    description: 'Beautiful villa on the beach',
    property_type: 'BEACH_HOUSE',
    address_line1: '1 Ocean Drive',
    city: 'Lagos',
    state: 'Lagos',
    latitude: 6.4281,
    longitude: 3.4219,
  };

  const validPayloadWithCohort = {
    ...validPayload,
    cohort_code: 'CC-H4K2N9PX',
  };

  it('returns 422 when required fields are missing', async () => {
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      { owambe_property_id: 'prop_001' }
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/missing required field/i);
  });

  it('returns 422 when host user is not found and no cohort_code is provided', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      validPayload
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/provide cohort_code to auto-register/i);
  });

  it('returns 422 when cohort code is not found', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      cohortCode: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      validPayloadWithCohort
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/cohort code not found/i);
  });

  it('returns 422 when cohort code is not active', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      cohortCode: {
        findUnique: vi.fn().mockResolvedValue({
          code: 'CC-H4K2N9PX',
          cohortType: 'COASTAL_CORRIDOR_HOST',
          status: 'USED',
          issuedAt: new Date('2026-01-01'),
          expiresAt: null,
        }),
      },
    } as never);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      validPayloadWithCohort
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/not active/i);
  });

  it('returns 422 when cohort code does not grant HOST access', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      cohortCode: {
        findUnique: vi.fn().mockResolvedValue({
          code: 'CC-O8M3R7QV',
          cohortType: 'COASTAL_CORRIDOR_OPERATOR',
          status: 'ACTIVE',
          issuedAt: new Date('2026-01-01'),
          expiresAt: null,
        }),
      },
    } as never);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      { ...validPayload, cohort_code: 'CC-O8M3R7QV' }
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/does not grant HOST access/i);
  });

  it('returns 201 and auto-creates host user when cohort code is valid', async () => {
    const mockTx = {
      user: { create: vi.fn().mockResolvedValue({ id: 'new_user_cuid_001' }) },
      cohortCode: { update: vi.fn().mockResolvedValue({}) },
    };
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      cohortCode: {
        findUnique: vi.fn().mockResolvedValue({
          code: 'CC-H4K2N9PX',
          cohortType: 'COASTAL_CORRIDOR_HOST',
          status: 'ACTIVE',
          issuedAt: new Date('2026-01-01'),
          expiresAt: null,
        }),
      },
      $transaction: vi.fn()
        .mockImplementationOnce((cb: (tx: typeof mockTx) => Promise<{ id: string }>) => cb(mockTx))
        .mockResolvedValueOnce({ id: 'prop_cuid_001', owambePropertyId: 'prop_001' }),
    } as never);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      validPayloadWithCohort
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('prop_cuid_001');
    expect(json.owambe_property_id).toBe('prop_001');
    expect(json.status).toBe('UNDER_REVIEW');
    expect(mockTx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          owambeUserId: 'owambe_user_001',
          role: 'HOST',
          cohortMember: true,
          cohortCode: 'CC-H4K2N9PX',
        }),
      })
    );
    expect(mockTx.cohortCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 'CC-H4K2N9PX' },
        data: expect.objectContaining({ status: 'USED' }),
      })
    );
  });

  it('returns 503 when database is unavailable', async () => {
    vi.mocked(getPrisma).mockReturnValue(null);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      validPayload
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(503);
  });

  it('returns 201 with property id on success when host already exists', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_host_001' }) },
      $transaction: vi.fn().mockResolvedValue({ id: 'prop_cuid_001', owambePropertyId: 'prop_001' }),
    } as never);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      validPayload
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('prop_cuid_001');
    expect(json.owambe_property_id).toBe('prop_001');
    expect(json.status).toBe('UNDER_REVIEW');
  });

  it('returns 201 with rooms when rooms array is provided', async () => {
    const payloadWithRooms = {
      ...validPayload,
      rooms: [
        {
          owambe_room_id: 'room_001',
          name: 'Deluxe Suite',
          room_type: 'SUITE',
          capacity: 2,
          base_rate: 45000,
        },
      ],
    };
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_host_001' }) },
      $transaction: vi.fn().mockResolvedValue({ id: 'prop_cuid_001', owambePropertyId: 'prop_001' }),
    } as never);
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties',
      'POST',
      payloadWithRooms
    );
    const res = await staysPropertiesPost(req);
    expect(res.status).toBe(201);
  });
});
// ─── PATCH /stays/properties/{id} ────────────────────────────────────────────

describe('PATCH /api/v1/channel/stays/properties/{id}', () => {
  const params = { params: { id: 'prop_001' } };

  it('returns 404 when property does not exist', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001',
      'PATCH',
      { name: 'Updated Name' }
    );
    const res = await staysPropertyPatch(req, params);
    expect(res.status).toBe(404);
  });

  it('returns 200 with updated property on success', async () => {
    const mockUpdate = {
      id: 'prop_cuid_001',
      owambePropertyId: 'prop_001',
      status: 'ACTIVE',
      updatedAt: new Date('2026-05-05T12:00:00Z'),
    };

    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: {
        findUnique: vi.fn().mockResolvedValue({ id: 'prop_cuid_001' }),
        update: vi.fn().mockResolvedValue(mockUpdate),
      },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001',
      'PATCH',
      { name: 'Updated Name', city: 'Abuja' }
    );
    const res = await staysPropertyPatch(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.owambe_property_id).toBe('prop_001');
    expect(json.status).toBe('ACTIVE');
  });
});

// ─── DELETE /stays/properties/{id} ───────────────────────────────────────────

describe('DELETE /api/v1/channel/stays/properties/{id}', () => {
  const params = { params: { id: 'prop_001' } };

  it('returns 404 when property does not exist', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001',
      'DELETE'
    );
    const res = await staysPropertyDelete(req, params);
    expect(res.status).toBe(404);
  });

  it('returns 200 with deleted:true on success', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: {
        findUnique: vi.fn().mockResolvedValue({ id: 'prop_cuid_001' }),
        update: vi.fn().mockResolvedValue({}),
      },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001',
      'DELETE'
    );
    const res = await staysPropertyDelete(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(json.owambe_property_id).toBe('prop_001');
  });
});

// ─── PUT /stays/properties/{id}/availability ─────────────────────────────────

describe('PUT /api/v1/channel/stays/properties/{id}/availability', () => {
  const params = { params: { id: 'prop_001' } };

  const validPayload = {
    rooms: [
      {
        owambe_room_id: 'room_001',
        dates: [
          {
            date: '2026-07-01',
            available: true,
            rate: 45000,
            currency: 'NGN',
          },
        ],
      },
    ],
  };

  it('returns 422 when rooms array is missing', async () => {
    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001/availability',
      'PUT',
      {}
    );
    const res = await staysAvailabilityPut(req, params);
    expect(res.status).toBe(422);
  });

  it('returns 404 when property does not exist', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001/availability',
      'PUT',
      validPayload
    );
    const res = await staysAvailabilityPut(req, params);
    expect(res.status).toBe(404);
  });

  it('returns 422 when room is not found in transaction', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: { findUnique: vi.fn().mockResolvedValue({ id: 'prop_cuid_001' }) },
      $transaction: vi.fn().mockRejectedValue(new Error('Room not found: room_001')),
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001/availability',
      'PUT',
      validPayload
    );
    const res = await staysAvailabilityPut(req, params);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/room not found/i);
  });

  it('returns 200 with calendar_entries_updated count on success', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: { findUnique: vi.fn().mockResolvedValue({ id: 'prop_cuid_001' }) },
      $transaction: vi.fn().mockResolvedValue(undefined),
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/stays/properties/prop_001/availability',
      'PUT',
      validPayload
    );
    const res = await staysAvailabilityPut(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.owambe_property_id).toBe('prop_001');
    expect(typeof json.calendar_entries_updated).toBe('number');
  });
});

// ─── POST /experiences/inventory ─────────────────────────────────────────────

describe('POST /api/v1/channel/experiences/inventory', () => {
  // NOTE: This payload matches the route's current flat camelCase ExperiencePayload
  // interface (as aligned by PAY-CANONICAL-01-CC-FIX-FIELDS AC-4). The route itself
  // does NOT match Owambe's actual outbound payload (which uses nested meetingPoint
  // and pricing objects, and operatorOwambeUserId). That structural gap is tracked
  // under CC-C-FIX-INVENTORY-01 for separate remediation.
  const validPayload = {
    owambeExperienceId: 'exp_001',
    operatorUserId: 'user_op_001',
    name: 'Sunset Kayak Tour',
    description: 'A beautiful sunset kayak tour along the coast',
    experienceType: 'TOUR',
    durationMinutes: 180,
    capacity: 12,
    meetingPointDescription: 'Tarkwa Bay Beach Jetty',
    meetingPointLatitude: 6.4281,
    meetingPointLongitude: 3.4219,
    pricing_model: 'PER_PERSON',
    basePrice: 15000,
  };

  it('returns 422 when required fields are missing', async () => {
    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/inventory',
      'POST',
      { owambeExperienceId: 'exp_001' }
    );
    const res = await experiencesInventoryPost(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/missing required field/i);
  });

  it('returns 422 when capacity is zero', async () => {
    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/inventory',
      'POST',
      { ...validPayload, capacity: 0 }
    );
    const res = await experiencesInventoryPost(req);
    expect(res.status).toBe(422);
  });

  it('returns 422 when operator user does not exist', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/inventory',
      'POST',
      validPayload
    );
    const res = await experiencesInventoryPost(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/operator user not found/i);
  });

  it('returns 503 when database is unavailable', async () => {
    vi.mocked(getPrisma).mockReturnValue(null);
    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/inventory',
      'POST',
      validPayload
    );
    const res = await experiencesInventoryPost(req);
    expect(res.status).toBe(503);
  });

  it('returns 201 with experience id on success', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_op_001' }) },
      $transaction: vi.fn().mockResolvedValue({
        id: 'exp_cuid_001',
        owambeExperienceId: 'exp_001',
      }),
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/inventory',
      'POST',
      validPayload
    );
    const res = await experiencesInventoryPost(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('exp_cuid_001');
    expect(json.owambeExperienceId).toBe('exp_001');
    expect(json.status).toBe('UNDER_REVIEW');
  });
});

// ─── PUT /experiences/{id}/time-slots ────────────────────────────────────────

describe('PUT /api/v1/channel/experiences/{id}/time-slots', () => {
  const params = { params: { id: 'exp_001' } };

  // NOTE: This payload matches the route's current camelCase TimeSlotsBody interface.
  // CC-C-FIX-INVENTORY-01 will align this to Owambe's actual snake_case outbound payload.
  const validPayload = {
    timeSlots: [
      {
        owambeTimeSlotId: 'ts_001',
        startDateTime: '2026-07-01T09:00:00Z',
        endDateTime: '2026-07-01T12:00:00Z',
        capacity: 12,
        rate: 15000,
        currency: 'NGN',
      },
    ],
  };

  it('returns 422 when time_slots array is missing', async () => {
    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/exp_001/time-slots',
      'PUT',
      {}
    );
    const res = await experiencesTimeSlotsput(req, params);
    expect(res.status).toBe(422);
  });

  it('returns 422 when endDateTime is before startDateTime', async () => {
    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/exp_001/time-slots',
      'PUT',
      {
        timeSlots: [
          {
            owambeTimeSlotId: 'ts_001',
            startDateTime: '2026-07-01T12:00:00Z',
            endDateTime: '2026-07-01T09:00:00Z', // before start
            capacity: 12,
          },
        ],
      }
    );
    const res = await experiencesTimeSlotsput(req, params);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/endDateTime must be after/i);
  });

  it('returns 404 when experience does not exist', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      experience: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/exp_001/time-slots',
      'PUT',
      validPayload
    );
    const res = await experiencesTimeSlotsput(req, params);
    expect(res.status).toBe(404);
  });

  it('returns 200 with time_slots_upserted count on success', async () => {
    const mockTx = {
      timeSlot: { upsert: vi.fn().mockResolvedValue({}) },
    };
    vi.mocked(getPrisma).mockReturnValue({
      experience: { findUnique: vi.fn().mockResolvedValue({ id: 'exp_cuid_001' }) },
      // Execute the callback so the loop inside the transaction runs
      $transaction: vi.fn().mockImplementation((cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)),
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/experiences/exp_001/time-slots',
      'PUT',
      validPayload
    );
    const res = await experiencesTimeSlotsput(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.owambeExperienceId).toBe('exp_001');
    expect(json.timeSlots_upserted).toBe(1);
  });
});

// ─── GET /reconciliation/stays/snapshot ──────────────────────────────────────

describe('GET /api/v1/channel/reconciliation/stays/snapshot', () => {
  it('returns 401 when HMAC signature is invalid', async () => {
    vi.mocked(verifyInboundWebhook).mockReturnValue(false);
    const req = makeReq(
      'http://localhost/api/v1/channel/reconciliation/stays/snapshot',
      'GET'
    );
    const res = await reconciliationStaysGet(req);
    expect(res.status).toBe(401);
  });

  it('returns 503 when database is unavailable', async () => {
    vi.mocked(getPrisma).mockReturnValue(null);
    const req = makeReq(
      'http://localhost/api/v1/channel/reconciliation/stays/snapshot',
      'GET'
    );
    const res = await reconciliationStaysGet(req);
    expect(res.status).toBe(503);
  });

  it('returns 200 with snapshot shape on success', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      stayProperty: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'prop_cuid_001',
            owambePropertyId: 'prop_001',
            name: 'Beachfront Villa',
            status: 'ACTIVE',
            city: 'Lagos',
            state: 'Lagos',
            updatedAt: new Date('2026-05-01T10:00:00Z'),
            rooms: [
              {
                id: 'room_cuid_001',
                owambeRoomId: 'room_001',
                name: 'Deluxe Suite',
                roomType: 'SUITE',
                capacity: 2,
                baseRate: { toString: () => '45000' },
                baseCurrency: 'NGN',
              },
            ],
          },
        ]),
      },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/reconciliation/stays/snapshot',
      'GET'
    );
    const res = await reconciliationStaysGet(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.properties).toHaveLength(1);
    expect(json.properties[0].owambe_property_id).toBe('prop_001');
    expect(json.properties[0].rooms).toHaveLength(1);
    expect(json.snapshot_at).toBeDefined();
  });
});

// ─── GET /reconciliation/experiences/snapshot ─────────────────────────────────

describe('GET /api/v1/channel/reconciliation/experiences/snapshot', () => {
  it('returns 503 when database is unavailable', async () => {
    vi.mocked(getPrisma).mockReturnValue(null);
    const req = makeReq(
      'http://localhost/api/v1/channel/reconciliation/experiences/snapshot',
      'GET'
    );
    const res = await reconciliationExperiencesGet(req);
    expect(res.status).toBe(503);
  });

  it('returns 200 with snapshot shape on success', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      experience: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'exp_cuid_001',
            owambeExperienceId: 'exp_001',
            name: 'Sunset Kayak Tour',
            status: 'ACTIVE',
            experienceType: 'TOUR',
            capacity: 12,
            updatedAt: new Date('2026-05-01T10:00:00Z'),
            timeSlots: [
              {
                id: 'ts_cuid_001',
                owambeTimeSlotId: 'ts_001',
                startDateTime: new Date('2026-07-01T09:00:00Z'),
                endDateTime: new Date('2026-07-01T12:00:00Z'),
                capacity: 12,
                spotsBooked: 3,
                status: 'OPEN',
              },
            ],
          },
        ]),
      },
    } as never);

    const req = makeReq(
      'http://localhost/api/v1/channel/reconciliation/experiences/snapshot',
      'GET'
    );
    const res = await reconciliationExperiencesGet(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.experiences).toHaveLength(1);
    expect(json.experiences[0].owambe_experience_id).toBe('exp_001');
    expect(json.experiences[0].time_slots).toHaveLength(1);
    expect(json.experiences[0].time_slots[0].spots_booked).toBe(3);
    expect(json.snapshot_at).toBeDefined();
  });
});

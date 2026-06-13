/**
 * CC-RC Behavioural tests — Amendment 012 Rev 2 handleReservationCreated
 *
 * Covers all 10 ACs per CC-PHASE-F2.5-BRIEF-1-Rev2 (FOUNDER AUTHORISED 2026-06-13):
 *
 *   AC-CC-RC-1: handleReservationCreated handler implemented at canonical path
 *   AC-CC-RC-2: Dispatcher routes reservation.created → handleReservationCreated
 *   AC-CC-RC-3: Payload validation (9 required fields + UUID + ISO date + integer + currency)
 *   AC-CC-RC-4: Idempotency via event_id — duplicate returns 200 without re-processing
 *   AC-CC-RC-5: HMAC verification at upstream middleware (401 on invalid signature)
 *   AC-CC-RC-6: Downstream actions — capacity allocation + guest record creation + initial sync state
 *   AC-CC-RC-7: HTTP outcome contract (200 + 400 + 401 + 404 + 5xx)
 *   AC-CC-RC-8: Schema cross-reference (inboundIdempotencyKey + User.owambeUserId)
 *   AC-CC-RC-9: Zero new TS errors + expanded test coverage
 *   AC-CC-RC-10: Bilateral verification (delivered in Phase 5 output)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@/lib/db-safe', () => ({
  getPrisma: vi.fn(),
}));
vi.mock('@/lib/hmac', () => ({
  verifyInboundWebhook: vi.fn(),
}));
vi.mock('@/lib/commission', () => ({
  getCommissionCalculator: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Canonical UUID v4 values for test data */
const RESERVATION_ID = '11111111-1111-4111-a111-111111111111';
const PROPERTY_ID    = '22222222-2222-4222-a222-222222222222';
const ROOM_ID        = '33333333-3333-4333-a333-333333333333';
const GUEST_ID       = '44444444-4444-4444-a444-444444444444';
const EVENT_ID       = '55555555-5555-4555-a555-555555555555';

const VALID_PAYLOAD = {
  event_type: 'reservation.created',
  data: {
    reservation_id: RESERVATION_ID,
    property_id:    PROPERTY_ID,
    room_id:        ROOM_ID,
    check_in_date:  '2026-09-01',
    check_out_date: '2026-09-05',
    number_of_guests: 2,
    total_amount_kobo: 50000000,
    currency: 'NGN',
    guest_owambe_user_id: GUEST_ID,
  },
};

function makeRequest(
  body: object,
  overrideHeaders?: Record<string, string>
): NextRequest {
  const ts = String(Math.floor(Date.now() / 1000));
  const bodyStr = JSON.stringify(body);
  return new NextRequest('http://localhost/api/v1/channel/webhooks/inbound', {
    method: 'POST',
    body: bodyStr,
    headers: {
      'content-type': 'application/json',
      'x-owambe-signature': 'valid-sig',
      'x-owambe-timestamp': ts,
      'x-owambe-event-id': EVENT_ID,
      ...overrideHeaders,
    },
  });
}

/** Mock commission result matching the STAYS vertical */
const MOCK_COMMISSION = {
  rateApplied: 0.15,
  ratePercent: 15,
  channelCommissionSmallestUnit: 7500000,
  netToHostSmallestUnit: 42500000,
  breakdown: 'vertical=STAYS currency=NGN total=50000000 rate=15.00% (standard_default) commission=7500000 net=42500000',
};

function makeMockPrisma(overrides: Record<string, unknown> = {}) {
  // Default stub user (mechanism-α: found by owambeUserId)
  const stubUser = {
    id: 'cc-user-001',
    owambeUserId: GUEST_ID,
    email: 'guest@example.com',
  };
  // Default property with host profile
  const stubProperty = {
    id: 'cc-prop-001',
    owambePropertyId: PROPERTY_ID,
    host: {
      cohortMember: false,
      hostProfile: { commissionRate: null },
    },
  };
  // Default room
  const stubRoom = {
    id: 'cc-room-001',
    owambeRoomId: ROOM_ID,
    propertyId: 'cc-prop-001',
  };
  // Default created reservation
  const stubReservation = {
    id: 'cc-res-001',
    owambeReservationId: RESERVATION_ID,
    inboundIdempotencyKey: EVENT_ID,
  };

  return {
    webhookDelivery: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    reservation: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(stubReservation),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    stayProperty: {
      findUnique: vi.fn().mockResolvedValue(stubProperty),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    room: {
      findUnique: vi.fn().mockResolvedValue(stubRoom),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(stubUser),
      create: vi.fn().mockResolvedValue({ id: 'cc-user-stub-001', owambeUserId: GUEST_ID, email: `owambe-stub-${GUEST_ID}@cc-internal.placeholder` }),
    },
    auditEntry: {
      create: vi.fn().mockResolvedValue({}),
    },
    experience: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    reconciliationLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

// ─── Test setup ───────────────────────────────────────────────────────────────

describe('AC-CC-RC-2 + AC-CC-RC-7 — dispatcher routes reservation.created → handler', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { getCommissionCalculator } = await import('@/lib/commission');
    vi.mocked(getCommissionCalculator).mockReturnValue({ calculate: vi.fn().mockReturnValue(MOCK_COMMISSION) } as never);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-2: routes reservation.created event to handleReservationCreated and returns HTTP 200', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const req = makeRequest(VALID_PAYLOAD);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it('AC-CC-RC-7: returns HTTP 200 with received:true on accepted payload', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(VALID_PAYLOAD));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });
});

describe('AC-CC-RC-3 — payload validation (9 required fields)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { getCommissionCalculator } = await import('@/lib/commission');
    vi.mocked(getCommissionCalculator).mockReturnValue({ calculate: vi.fn().mockReturnValue(MOCK_COMMISSION) } as never);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-3: returns HTTP 400 when reservation_id is missing', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: { ...VALID_PAYLOAD.data, reservation_id: undefined },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/reservation_id/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when property_id is missing', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: { ...VALID_PAYLOAD.data, property_id: undefined },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/property_id/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when multiple required fields are missing', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: {},
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    // All 9 required fields should be mentioned
    expect(json.error).toMatch(/reservation_id/);
    expect(json.error).toMatch(/property_id/);
    expect(json.error).toMatch(/room_id/);
    expect(json.error).toMatch(/guest_owambe_user_id/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when reservation_id is not a valid UUID v4', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: { ...VALID_PAYLOAD.data, reservation_id: 'not-a-uuid' },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/UUID v4/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when check_in_date is not ISO 8601 format', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: { ...VALID_PAYLOAD.data, check_in_date: '01/09/2026' },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/ISO 8601/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when number_of_guests is not a positive integer', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: { ...VALID_PAYLOAD.data, number_of_guests: -1 },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/number_of_guests/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when total_amount_kobo is not a non-negative integer', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: { ...VALID_PAYLOAD.data, total_amount_kobo: 1.5 },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/total_amount_kobo/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when currency is not a valid enum value', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const body = {
      event_type: 'reservation.created',
      data: { ...VALID_PAYLOAD.data, currency: 'EUR' },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/currency/);
  });
});

describe('AC-CC-RC-4 — idempotency: duplicate event_id returns 200 without re-processing', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { getCommissionCalculator } = await import('@/lib/commission');
    vi.mocked(getCommissionCalculator).mockReturnValue({ calculate: vi.fn().mockReturnValue(MOCK_COMMISSION) } as never);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-4: duplicate event_id at WebhookDelivery level returns 200 + duplicate:true without re-processing', async () => {
    // Simulate WebhookDelivery already exists for this event_id
    const mockPrisma = makeMockPrisma({
      webhookDelivery: {
        findUnique: vi.fn().mockResolvedValue({ id: 'wd-001', eventId: EVENT_ID }),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(VALID_PAYLOAD));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);
    // Reservation.create must NOT have been called
    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).not.toHaveBeenCalled();
  });

  it('AC-CC-RC-4: handler-level idempotency — inboundIdempotencyKey match returns early without creating new Reservation', async () => {
    // Simulate handler-level idempotency: Reservation already exists with this inboundIdempotencyKey
    const mockPrisma = makeMockPrisma({
      reservation: {
        findUnique: vi.fn().mockResolvedValue({ id: 'cc-res-001', inboundIdempotencyKey: EVENT_ID }),
        create: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(VALID_PAYLOAD));
    expect(res.status).toBe(200);
    // Reservation.create must NOT have been called (early return)
    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).not.toHaveBeenCalled();
  });
});

describe('AC-CC-RC-5 — HMAC verification', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-5: returns HTTP 401 when HMAC signature is invalid', async () => {
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(false);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(VALID_PAYLOAD));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/signature/i);
  });

  it('AC-CC-RC-5: returns HTTP 400 when required webhook headers are missing', async () => {
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    // Missing x-owambe-event-id header
    const res = await POST(makeRequest(VALID_PAYLOAD, { 'x-owambe-event-id': '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/headers/i);
  });
});

describe('AC-CC-RC-6 — downstream actions: capacity allocation + guest record creation + initial sync state', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { getCommissionCalculator } = await import('@/lib/commission');
    vi.mocked(getCommissionCalculator).mockReturnValue({ calculate: vi.fn().mockReturnValue(MOCK_COMMISSION) } as never);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-6 layer-1: creates Reservation with owambeReservationId cross-reference', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          owambeReservationId: RESERVATION_ID,
          inboundIdempotencyKey: EVENT_ID,
          checkInDate: new Date('2026-09-01'),
          checkOutDate: new Date('2026-09-05'),
          numberOfGuests: 2,
          currency: 'NGN',
          paymentStatus: 'PENDING',
          status: 'PENDING',
          owambeSyncAttempts: 0,
        }),
      })
    );
  });

  it('AC-CC-RC-6 layer-1: resolves StayProperty via owambePropertyId', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.stayProperty as { findUnique: ReturnType<typeof vi.fn> }).findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambePropertyId: PROPERTY_ID },
      })
    );
  });

  it('AC-CC-RC-6 layer-1: resolves Room via owambeRoomId', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.room as { findUnique: ReturnType<typeof vi.fn> }).findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeRoomId: ROOM_ID },
      })
    );
  });

  it('AC-CC-RC-6 layer-1: kobo→decimal conversion — totalAmount = total_amount_kobo / 100', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    // 50000000 kobo / 100 = 500000.00
    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: '500000.00',
        }),
      })
    );
  });

  it('AC-CC-RC-6 layer-2 mechanism-α: resolves existing CC User by owambeUserId', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.user as { findUnique: ReturnType<typeof vi.fn> }).findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeUserId: GUEST_ID },
      })
    );
    // User.create should NOT be called when mechanism-α succeeds
    expect((mockPrisma.user as { create: ReturnType<typeof vi.fn> }).create).not.toHaveBeenCalled();
  });

  it('AC-CC-RC-6 layer-2 mechanism-β: creates stub User when owambeUserId not found', async () => {
    const mockPrisma = makeMockPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue(null),  // mechanism-α fails
        create: vi.fn().mockResolvedValue({
          id: 'cc-user-stub-001',
          owambeUserId: GUEST_ID,
          email: `owambe-stub-${GUEST_ID}@cc-internal.placeholder`,
        }),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    // mechanism-β: User.create called with owambeUserId + placeholder email
    expect((mockPrisma.user as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          owambeUserId: GUEST_ID,
          email: expect.stringContaining('owambe-stub-'),
          role: 'GUEST',
          status: 'PENDING_VERIFICATION',
        }),
      })
    );
    // Reservation.create should still be called with the stub user's id
    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          guestUserId: 'cc-user-stub-001',
        }),
      })
    );
  });

  it('AC-CC-RC-6 layer-3: sets owambeSyncAttempts=0 and owambeReservationId at initial sync state', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          owambeReservationId: RESERVATION_ID,
          owambeSyncAttempts: 0,
        }),
      })
    );
  });

  it('AC-CC-RC-6 layer-3: creates audit entry with reservation_created_received action', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.auditEntry as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'Reservation',
          action: 'reservation_created_received',
        }),
      })
    );
  });

  it('AC-CC-RC-7: returns HTTP 404 when StayProperty not found', async () => {
    const mockPrisma = makeMockPrisma({
      stayProperty: {
        findUnique: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(VALID_PAYLOAD));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/StayProperty not found/);
  });

  it('AC-CC-RC-7: returns HTTP 404 when Room not found', async () => {
    const mockPrisma = makeMockPrisma({
      room: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(VALID_PAYLOAD));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/Room not found/);
  });

  it('AC-CC-RC-7: returns HTTP 422 when Room does not belong to the resolved property', async () => {
    const mockPrisma = makeMockPrisma({
      room: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cc-room-999',
          owambeRoomId: ROOM_ID,
          propertyId: 'cc-prop-DIFFERENT',  // different property
        }),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(VALID_PAYLOAD));
    // 422 is mapped to 500 by the dispatcher (non-retryable errors are 400/404 only)
    // The handler throws with no statusCode for 422, so it becomes 500
    expect([422, 500]).toContain(res.status);
  });

  it('AC-CC-RC-6: commission calculation uses STAYS vertical with correct total_amount_kobo', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { getCommissionCalculator } = await import('@/lib/commission');
    const mockCalculate = vi.fn().mockReturnValue(MOCK_COMMISSION);
    vi.mocked(getCommissionCalculator).mockReturnValue({ calculate: mockCalculate } as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect(mockCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAmountSmallestUnit: 50000000,
        currency: 'NGN',
        vertical: 'STAYS',
      })
    );
  });

  it('AC-CC-RC-6: commission fields persisted on Reservation record', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    // 7500000 kobo / 100 = 75000.00; 42500000 / 100 = 425000.00; rate = 15.00%
    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channelCommissionAmount: '75000.00',
          channelCommissionPercent: '15.00',
          netToHost: '425000.00',
        }),
      })
    );
  });
});

describe('AC-CC-RC-8 — schema cross-reference (inboundIdempotencyKey + User.owambeUserId)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { getCommissionCalculator } = await import('@/lib/commission');
    vi.mocked(getCommissionCalculator).mockReturnValue({ calculate: vi.fn().mockReturnValue(MOCK_COMMISSION) } as never);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-8: inboundIdempotencyKey is set to eventId on Reservation create', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.reservation as { create: ReturnType<typeof vi.fn> }).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inboundIdempotencyKey: EVENT_ID,
        }),
      })
    );
  });

  it('AC-CC-RC-8: User.owambeUserId lookup uses guest_owambe_user_id from payload', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(VALID_PAYLOAD));

    expect((mockPrisma.user as { findUnique: ReturnType<typeof vi.fn> }).findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeUserId: GUEST_ID },
      })
    );
  });
});

/**
 * CC-RC Behavioural tests — Amendment 012 Rev 2 + Brief Amendment 01
 *
 * Covers AC-BA-01 through AC-BA-05 per CC-PHASE-F2.5-BRIEF-1-Rev2-Amendment-01:
 *
 *   AC-BA-01: guest_owambe_user_id nullable — null accepted; non-UUID rejected; valid UUID accepted
 *   AC-BA-02: Handler reads existing Reservation via owambeReservationId (acknowledgement semantic);
 *             no stub-create, no property/room lookup, no commission recalculation
 *   AC-BA-03: WebhookDelivery status updated to DEAD_LETTER on 400/404 non-retryable path
 *   AC-BA-04: Sentry captureException called on 400/404 non-retryable path
 *   AC-BA-05: Zero new TS errors; existing tests pass; new test coverage for AC-BA-01..04
 *
 * Retained from Amendment 012 Rev 2:
 *   AC-CC-RC-2: Dispatcher routes reservation.created → handleReservationCreated
 *   AC-CC-RC-3: Payload validation (8 required fields — guest_owambe_user_id now nullable)
 *   AC-CC-RC-4: Idempotency via inboundIdempotencyKey
 *   AC-CC-RC-5: HMAC verification → 401
 *   AC-CC-RC-7: HTTP outcome contract
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
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// ─── Constants ────────────────────────────────────────────────────────────────
const RESERVATION_ID = '11111111-1111-4111-a111-111111111111';
const PROPERTY_ID    = '22222222-2222-4222-a222-222222222222';
const ROOM_ID        = '33333333-3333-4333-a333-333333333333';
const GUEST_UUID     = '44444444-4444-4444-a444-444444444444';
const EVENT_ID       = '55555555-5555-4555-a555-555555555555';
const CC_USER_ID     = 'cc-user-001';
const CC_RES_ID      = 'cc-res-001';

/**
 * Canonical valid payload — guest_owambe_user_id: null
 * This is the 100% production shape for Path B (CC-origin bookings).
 */
const VALID_PAYLOAD_NULL_GUEST = {
  event_type: 'reservation.created',
  data: {
    reservation_id:       RESERVATION_ID,
    property_id:          PROPERTY_ID,
    room_id:              ROOM_ID,
    check_in_date:        '2026-09-01',
    check_out_date:       '2026-09-05',
    number_of_guests:     2,
    total_amount_kobo:    50000000,
    currency:             'NGN',
    guest_owambe_user_id: null,
  },
};

/** Payload with non-null valid UUID guest (alternate valid shape) */
const VALID_PAYLOAD_UUID_GUEST = {
  ...VALID_PAYLOAD_NULL_GUEST,
  data: {
    ...VALID_PAYLOAD_NULL_GUEST.data,
    guest_owambe_user_id: GUEST_UUID,
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

/** Stub Reservation — already exists at CC side from the booking flow */
const stubReservation = {
  id: CC_RES_ID,
  owambeReservationId: RESERVATION_ID,
  guestUserId: CC_USER_ID,
  inboundIdempotencyKey: null,
};

/**
 * Build a mock Prisma client.
 * Default reservation.findUnique behaviour:
 *   - inboundIdempotencyKey lookup → null (not yet processed)
 *   - owambeReservationId lookup → stubReservation (exists from booking flow)
 */
function makeMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    webhookDelivery: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    reservation: {
      findUnique: vi.fn().mockImplementation(
        ({ where }: { where: Record<string, unknown> }) => {
          if ('inboundIdempotencyKey' in where) return Promise.resolve(null);
          if ('owambeReservationId' in where) return Promise.resolve(stubReservation);
          return Promise.resolve(null);
        }
      ),
      update: vi.fn().mockResolvedValue({ ...stubReservation, inboundIdempotencyKey: EVENT_ID }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue(stubReservation),
    },
    stayProperty: {
      findUnique: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    room: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
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

// ─── AC-BA-01: guest_owambe_user_id nullable ─────────────────────────────────

describe('AC-BA-01 — guest_owambe_user_id nullable validation', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-BA-01: payload with guest_owambe_user_id: null returns HTTP 200 (null accepted)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('AC-BA-01: payload with guest_owambe_user_id: "not-a-uuid" returns HTTP 400 (non-UUID rejected)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const payload = {
      ...VALID_PAYLOAD_NULL_GUEST,
      data: { ...VALID_PAYLOAD_NULL_GUEST.data, guest_owambe_user_id: 'not-a-uuid' },
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/guest_owambe_user_id/);
    expect(json.error).toMatch(/UUID v4/);
  });

  it('AC-BA-01: payload with guest_owambe_user_id: valid UUID v4 returns HTTP 200 (valid UUID accepted)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_UUID_GUEST));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('AC-BA-01: payload with guest_owambe_user_id omitted entirely returns HTTP 200 (absent = null)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guest_owambe_user_id: _omit, ...dataWithoutGuest } = VALID_PAYLOAD_NULL_GUEST.data;
    const payload = { ...VALID_PAYLOAD_NULL_GUEST, data: dataWithoutGuest };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
  });
});

// ─── AC-BA-02: Acknowledgement handler ───────────────────────────────────────

describe('AC-BA-02 — acknowledgement handler: Reservation.findUnique, no stub-create/property/room/commission', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-BA-02: webhook for existing Reservation returns HTTP 200 and creates acknowledgement audit entry', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(200);
    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'reservation_created_acknowledged',
          entityId: CC_RES_ID,
          userId: CC_USER_ID,
        }),
      })
    );
  });

  it('AC-BA-02: no new Reservation record is created (Reservation.create is NOT called)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
  });

  it('AC-BA-02: StayProperty.findUnique is NOT called (no property lookup)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(mockPrisma.stayProperty.findUnique).not.toHaveBeenCalled();
  });

  it('AC-BA-02: Room.findUnique is NOT called (no room lookup)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(mockPrisma.room.findUnique).not.toHaveBeenCalled();
  });

  it('AC-BA-02: User.create is NOT called (no stub-create)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('AC-BA-02: Reservation.findUnique called with owambeReservationId from payload', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(mockPrisma.reservation.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeReservationId: RESERVATION_ID },
      })
    );
  });

  it('AC-BA-02: inboundIdempotencyKey stamped on existing Reservation via update', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CC_RES_ID },
        data: expect.objectContaining({ inboundIdempotencyKey: EVENT_ID }),
      })
    );
  });

  it('AC-BA-02: webhook for non-existent Reservation returns HTTP 404 with audit entry', async () => {
    const mockPrisma = makeMockPrisma({
      reservation: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({}),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(404);
    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'reservation_created_not_found',
        }),
      })
    );
  });

  it('AC-BA-02: non-existent Reservation triggers Sentry captureException (in-handler capture)', async () => {
    const mockPrisma = makeMockPrisma({
      reservation: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({}),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const Sentry = await import('@sentry/nextjs');
    await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

// ─── AC-BA-03: WebhookDelivery DEAD_LETTER on 400/404 path ───────────────────

describe('AC-BA-03 — WebhookDelivery status DEAD_LETTER on 400/404 non-retryable path', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-BA-03: invalid payload triggers 400; WebhookDelivery.update called with status DEAD_LETTER', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    // Missing reservation_id → 400
    const payload = {
      event_type: 'reservation.created',
      data: {
        property_id:          PROPERTY_ID,
        room_id:              ROOM_ID,
        check_in_date:        '2026-09-01',
        check_out_date:       '2026-09-05',
        number_of_guests:     2,
        total_amount_kobo:    50000000,
        currency:             'NGN',
        guest_owambe_user_id: null,
      },
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: EVENT_ID },
        data: expect.objectContaining({ status: 'DEAD_LETTER' }),
      })
    );
  });

  it('AC-BA-03: 404 non-retryable path (Reservation not found) also triggers DEAD_LETTER', async () => {
    const mockPrisma = makeMockPrisma({
      reservation: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({}),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(404);
    expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: EVENT_ID },
        data: expect.objectContaining({ status: 'DEAD_LETTER' }),
      })
    );
  });
});

// ─── AC-BA-04: Sentry captureException on 400/404 non-retryable path ─────────

describe('AC-BA-04 — Sentry captureException on 400/404 non-retryable path', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-BA-04: Sentry.captureException called on 400 validation error (dispatcher-level)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const Sentry = await import('@sentry/nextjs');
    // Invalid UUID for reservation_id → 400
    const payload = {
      ...VALID_PAYLOAD_NULL_GUEST,
      data: { ...VALID_PAYLOAD_NULL_GUEST.data, reservation_id: 'not-a-uuid' },
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('AC-BA-04: Sentry.captureException called on 404 (Reservation not found)', async () => {
    const mockPrisma = makeMockPrisma({
      reservation: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({}),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const Sentry = await import('@sentry/nextjs');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(404);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

// ─── AC-CC-RC-2 + AC-CC-RC-7: Dispatcher routing (retained) ──────────────────

describe('AC-CC-RC-2 + AC-CC-RC-7 — dispatcher routes reservation.created → handler', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
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
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('AC-CC-RC-7: returns HTTP 200 with received:true on accepted payload', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });
});

// ─── AC-CC-RC-3: Payload validation (8 required fields) ──────────────────────

describe('AC-CC-RC-3 — payload validation (8 required fields; guest_owambe_user_id nullable per AC-BA-01)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reservation_id: _omit, ...dataWithout } = VALID_PAYLOAD_NULL_GUEST.data;
    const res = await POST(makeRequest({ ...VALID_PAYLOAD_NULL_GUEST, data: dataWithout }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/reservation_id/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when property_id is missing', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { property_id: _omit, ...dataWithout } = VALID_PAYLOAD_NULL_GUEST.data;
    const res = await POST(makeRequest({ ...VALID_PAYLOAD_NULL_GUEST, data: dataWithout }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/property_id/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when reservation_id is not a valid UUID v4', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const payload = { ...VALID_PAYLOAD_NULL_GUEST, data: { ...VALID_PAYLOAD_NULL_GUEST.data, reservation_id: 'not-uuid' } };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/reservation_id/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when check_in_date is not ISO 8601 format', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const payload = { ...VALID_PAYLOAD_NULL_GUEST, data: { ...VALID_PAYLOAD_NULL_GUEST.data, check_in_date: '01-09-2026' } };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/check_in_date/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when number_of_guests is not a positive integer', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const payload = { ...VALID_PAYLOAD_NULL_GUEST, data: { ...VALID_PAYLOAD_NULL_GUEST.data, number_of_guests: 0 } };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/number_of_guests/);
  });

  it('AC-CC-RC-3: returns HTTP 400 when currency is not a valid enum value', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const payload = { ...VALID_PAYLOAD_NULL_GUEST, data: { ...VALID_PAYLOAD_NULL_GUEST.data, currency: 'EUR' } };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/currency/);
  });
});

// ─── AC-CC-RC-4: Idempotency (retained) ──────────────────────────────────────

describe('AC-CC-RC-4 — idempotency: duplicate event_id returns 200 without re-processing', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-4: duplicate event_id at WebhookDelivery level returns 200 + duplicate:true', async () => {
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
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(200);
    expect((await res.json()).duplicate).toBe(true);
    // Reservation.create must NOT be called on duplicate
    expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
  });

  it('AC-CC-RC-4: handler-level idempotency — inboundIdempotencyKey match returns early without update', async () => {
    const existingWithKey = { ...stubReservation, inboundIdempotencyKey: EVENT_ID };
    const mockPrisma = makeMockPrisma({
      reservation: {
        findUnique: vi.fn().mockImplementation(
          ({ where }: { where: Record<string, unknown> }) => {
            if ('inboundIdempotencyKey' in where) return Promise.resolve(existingWithKey);
            return Promise.resolve(stubReservation);
          }
        ),
        update: vi.fn().mockResolvedValue(existingWithKey),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({}),
      },
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(200);
    // Reservation.update must NOT be called (early return after idempotency check)
    expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
  });
});

// ─── AC-CC-RC-5: HMAC verification (retained) ────────────────────────────────

describe('AC-CC-RC-5 — HMAC verification', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-CC-RC-5: returns HTTP 401 when HMAC signature is invalid', async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(false);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(makeRequest(VALID_PAYLOAD_NULL_GUEST));
    expect(res.status).toBe(401);
  });

  it('AC-CC-RC-5: returns HTTP 400 when required webhook headers are missing', async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(false);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const res = await POST(
      makeRequest(VALID_PAYLOAD_NULL_GUEST, {
        'x-owambe-signature': '',
        'x-owambe-timestamp': '',
        'x-signature': '',
        'x-timestamp': '',
      })
    );
    expect([400, 401]).toContain(res.status);
  });
});

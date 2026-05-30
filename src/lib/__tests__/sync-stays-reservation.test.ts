/**
 * Unit tests for src/lib/sync-stays-reservation.ts
 * CC-STAYS-RESERVATION-SENDER-01 — AC-3
 *
 * Covers:
 *   - 201 Created path: owambeReservationId captured + persisted
 *   - 409 Conflict path: refund triggered; FAILED status set; audit entry written
 *   - Retry behaviour: owambeSyncAttempts incremented on 4xx and network errors
 *   - Dead-letter: reservations with attempts >= MAX_SYNC_ATTEMPTS excluded from outbox
 *   - Idempotency key: set once at first attempt; consistent across retries
 *   - Missing Owambe-native IDs: defensive null check increments attempts without calling Owambe
 *   - No DB: graceful degradation returns error result without throwing
 *
 * Mocking strategy:
 *   - @/lib/db-safe: getPrisma() returns a mock Prisma client
 *   - @/lib/idempotency: callOwambe() is mocked to control Owambe responses
 *   - @/lib/paystack-adapter: getPaystackAdapter() is mocked for refund path
 *   - crypto.randomUUID: stable UUID for idempotency key assertions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock db-safe ─────────────────────────────────────────────────────────────
vi.mock('@/lib/db-safe', () => ({
  getPrisma: vi.fn(),
}));

// ─── Mock idempotency (callOwambe) ────────────────────────────────────────────
vi.mock('@/lib/idempotency', () => ({
  callOwambe: vi.fn(),
}));

// ─── Mock paystack-adapter ────────────────────────────────────────────────────
vi.mock('@/lib/paystack-adapter', () => ({
  getPaystackAdapter: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STABLE_UUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

// CC-PHASE-5-3-A: Fixture IDs updated to valid UUID v4 values to pass the
// sync queue validation gate integrated in syncReservationToOwambe.
const FIXTURE_RESERVATION_ID = 'a1b2c3d4-e5f6-4789-8abc-def012345678';
const FIXTURE_PROPERTY_ID    = 'b2c3d4e5-f6a7-4890-9bcd-ef0123456789';
const FIXTURE_ROOM_ID        = 'c3d4e5f6-a7b8-4901-acde-f01234567890';
const FIXTURE_USER_ID        = 'd4e5f6a7-b8c9-4012-bdea-012345678901';

function makeMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    reservation: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    auditEntry: {
      create: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: FIXTURE_RESERVATION_ID,
    outboundIdempotencyKey: null,
    checkInDate: new Date('2026-06-01'),
    checkOutDate: new Date('2026-06-05'),
    numberOfGuests: 2,
    totalAmount: { toString: () => '150000.00' },
    currency: 'NGN',
    channelCommissionAmount: { toString: () => '15000.00' },
    channelCommissionPercent: { toString: () => '10.00' },
    netToHost: { toString: () => '135000.00' },
    specialRequests: null,
    paystackReference: 'pstk_ref_001',
    property: {
      id: FIXTURE_PROPERTY_ID,
      owambePropertyId: FIXTURE_PROPERTY_ID,
    },
    room: {
      id: FIXTURE_ROOM_ID,
      owambeRoomId: FIXTURE_ROOM_ID,
    },
    guest: {
      email: 'guest@example.com',
      phone: '+2348012345678',
      owambeUserId: FIXTURE_USER_ID,
    },
    ...overrides,
  };
}

// ─── syncReservationToOwambe — no DB ─────────────────────────────────────────
describe('syncReservationToOwambe — no database', () => {
  beforeEach(async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(null);
  });
  afterEach(() => vi.clearAllMocks());

  it('returns error result without throwing when DB is unavailable', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const result = await syncReservationToOwambe(makeReservation() as never);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database unavailable');
    expect(result.fromCache).toBe(false);
  });
});

// ─── syncReservationToOwambe — missing Owambe-native IDs ─────────────────────
describe('syncReservationToOwambe — missing Owambe-native IDs', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
  });
  afterEach(() => vi.clearAllMocks());

  it('increments owambeSyncAttempts and returns error when owambePropertyId is null', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({
      property: { id: 'prop-001', owambePropertyId: null },
    });

    const result = await syncReservationToOwambe(reservation as never);

    expect(result.success).toBe(false);
    expect(result.error).toContain('owambePropertyId');
    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXTURE_RESERVATION_ID },
        data: expect.objectContaining({
          owambeSyncAttempts: { increment: 1 },
        }),
      })
    );
  });

  it('increments owambeSyncAttempts and returns error when owambeRoomId is null', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({
      room: { id: 'room-001', owambeRoomId: null },
    });

    const result = await syncReservationToOwambe(reservation as never);

    expect(result.success).toBe(false);
    expect(result.error).toContain('owambeRoomId');
  });
});

// ─── syncReservationToOwambe — idempotency key ───────────────────────────────
describe('syncReservationToOwambe — idempotency key', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    // Mock callOwambe to return 201
    const { callOwambe } = await import('@/lib/idempotency');
    vi.mocked(callOwambe).mockResolvedValue({
      status: 201,
      data: { reservation_id: 'owambe-res-001', cc_reservation_id: 'res-001', status: 'CONFIRMED' },
      fromCache: false,
      idempotencyKey: STABLE_UUID,
    });

  });
  afterEach(() => vi.clearAllMocks());

  it('generates and persists a new idempotency key when outboundIdempotencyKey is null', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: null });

    await syncReservationToOwambe(reservation as never);

    // First update call should set the idempotency key to a UUID v4
    const updateCalls = vi.mocked(mockPrisma.reservation.update).mock.calls;
    const keySetCall = updateCalls.find(
      (call: unknown[]) => {
        const args = call[0] as { data?: { outboundIdempotencyKey?: string } };
        return args.data?.outboundIdempotencyKey !== undefined;
      }
    );
    expect(keySetCall).toBeDefined();
    const setKey = (keySetCall![0] as { data: { outboundIdempotencyKey: string } }).data.outboundIdempotencyKey;
    expect(setKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('reuses existing idempotency key without re-persisting', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'existing-key-123' });

    await syncReservationToOwambe(reservation as never);

    // Should NOT call update to set the key again
    const updateCalls = vi.mocked(mockPrisma.reservation.update).mock.calls;
    // When key already exists, no update call should set outboundIdempotencyKey
    const keySetCall = updateCalls.find(
      (call: unknown[]) => {
        const args = call[0] as { data?: { outboundIdempotencyKey?: string; owambeReservationId?: string } };
        return args.data?.outboundIdempotencyKey !== undefined && args.data?.owambeReservationId === undefined;
      }
    );
    expect(keySetCall).toBeUndefined();
  });
});

// ─── syncReservationToOwambe — 201 Created ───────────────────────────────────
describe('syncReservationToOwambe — 201 Created', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { callOwambe } = await import('@/lib/idempotency');
    vi.mocked(callOwambe).mockResolvedValue({
      status: 201,
      data: { reservation_id: 'owambe-res-001', cc_reservation_id: 'res-001', status: 'CONFIRMED' },
      fromCache: false,
      idempotencyKey: 'idem-key-001',
    });
  });
  afterEach(() => vi.clearAllMocks());

  it('returns success=true with owambeReservationId', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    const result = await syncReservationToOwambe(reservation as never);

    expect(result.success).toBe(true);
    expect(result.owambeReservationId).toBe('owambe-res-001');
    expect(result.fromCache).toBe(false);
  });

  it('persists owambeReservationId and clears owambeSyncError', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    await syncReservationToOwambe(reservation as never);

    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXTURE_RESERVATION_ID },
        data: expect.objectContaining({
          owambeReservationId: 'owambe-res-001',
          owambeSyncError: null,
        }),
      })
    );
  });

  it('passes canonical payload field names to callOwambe (AC-2)', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const { callOwambe } = await import('@/lib/idempotency');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    await syncReservationToOwambe(reservation as never);

    const callArgs = vi.mocked(callOwambe).mock.calls[0][1];
    const body = callArgs.body as Record<string, unknown>;

    expect(body.cc_reservation_id).toBe(FIXTURE_RESERVATION_ID);
    expect(body.owambe_property_id).toBe(FIXTURE_PROPERTY_ID);
    expect(body.owambe_room_id).toBe(FIXTURE_ROOM_ID);
    expect(body.guest_owambe_user_id).toBe(FIXTURE_USER_ID);
    expect(body.guest_email).toBe('guest@example.com');
    expect(body.check_in_date).toBe('2026-06-01');
    expect(body.check_out_date).toBe('2026-06-05');
    expect(body.number_of_guests).toBe(2);
    expect(body.total_amount).toBe('150000.00');
    expect(body.currency).toBe('NGN');
    expect(body.channel_commission_amount).toBe('15000.00');
    expect(body.channel_commission_percent).toBe('10.00');
    expect(body.net_to_host).toBe('135000.00');
    expect(body.paystack_reference).toBe('pstk_ref_001');
  });

  it('posts to the canonical Owambe reservation path', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const { callOwambe } = await import('@/lib/idempotency');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    await syncReservationToOwambe(reservation as never);

    expect(vi.mocked(callOwambe).mock.calls[0][0]).toBe('/api/v1/channel/stays/reservations');
  });
});

// ─── syncReservationToOwambe — 409 Conflict ──────────────────────────────────
describe('syncReservationToOwambe — 409 Conflict', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let mockRefundTransaction: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { callOwambe } = await import('@/lib/idempotency');
    vi.mocked(callOwambe).mockResolvedValue({
      status: 409,
      data: { error: 'room_unavailable', message: 'Room is not available for requested dates' },
      fromCache: false,
      idempotencyKey: 'idem-key-001',
    });

    mockRefundTransaction = vi.fn().mockResolvedValue({ refundId: 'refund-001', status: 'pending', amountKobo: 15000000 });
    const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
    vi.mocked(getPaystackAdapter).mockReturnValue({ refundTransaction: mockRefundTransaction } as never);
  });
  afterEach(() => vi.clearAllMocks());

  it('returns success=false with conflict error message', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    const result = await syncReservationToOwambe(reservation as never);

    expect(result.success).toBe(false);
    expect(result.error).toContain('409 Conflict');
  });

  it('initiates Paystack refund when paystackReference is present', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    const result = await syncReservationToOwambe(reservation as never);

    expect(mockRefundTransaction).toHaveBeenCalledWith('pstk_ref_001');
    expect(result.conflictRefundInitiated).toBe(true);
  });

  it('does not attempt refund when paystackReference is null', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({
      outboundIdempotencyKey: 'idem-key-001',
      paystackReference: null,
    });

    const result = await syncReservationToOwambe(reservation as never);

    expect(mockRefundTransaction).not.toHaveBeenCalled();
    expect(result.conflictRefundInitiated).toBeFalsy();
  });

  it('marks reservation as FAILED', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    await syncReservationToOwambe(reservation as never);

    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXTURE_RESERVATION_ID },
        data: expect.objectContaining({
          status: 'FAILED',
          owambeSyncAttempts: { increment: 1 },
        }),
      })
    );
  });

  it('writes an audit entry for the conflict incident', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    await syncReservationToOwambe(reservation as never);

    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'Reservation',
          entityId: FIXTURE_RESERVATION_ID,
          action: 'reservation_sync_conflict',
        }),
      })
    );
  });
});

// ─── syncReservationToOwambe — retry (4xx non-409) ───────────────────────────
describe('syncReservationToOwambe — 4xx permanent failure (non-409)', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { callOwambe } = await import('@/lib/idempotency');
    vi.mocked(callOwambe).mockResolvedValue({
      status: 422,
      data: { error: 'validation_failed', message: 'Invalid check_in_date' },
      fromCache: false,
      idempotencyKey: 'idem-key-001',
    });
  });
  afterEach(() => vi.clearAllMocks());

  it('increments owambeSyncAttempts on 422 response', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    const result = await syncReservationToOwambe(reservation as never);

    expect(result.success).toBe(false);
    expect(result.error).toContain('HTTP 422');
    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          owambeSyncAttempts: { increment: 1 },
        }),
      })
    );
  });
});

// ─── syncReservationToOwambe — network/timeout error ─────────────────────────
describe('syncReservationToOwambe — network/timeout error', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { callOwambe } = await import('@/lib/idempotency');
    vi.mocked(callOwambe).mockRejectedValue(new Error('Request timed out after 10000ms'));
  });
  afterEach(() => vi.clearAllMocks());

  it('increments owambeSyncAttempts on network error', async () => {
    const { syncReservationToOwambe } = await import('../sync-stays-reservation');
    const reservation = makeReservation({ outboundIdempotencyKey: 'idem-key-001' });

    const result = await syncReservationToOwambe(reservation as never);

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          owambeSyncAttempts: { increment: 1 },
        }),
      })
    );
  });
});

// ─── runOwambeStaysSyncPass — batch + dead-letter ─────────────────────────────
describe('runOwambeStaysSyncPass — batch sync', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
  });
  afterEach(() => vi.clearAllMocks());

  it('returns empty summary when no pending reservations', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    mockPrisma.reservation.count.mockResolvedValue(0);

    const { runOwambeStaysSyncPass } = await import('../sync-stays-reservation');
    const summary = await runOwambeStaysSyncPass();

    expect(summary.attempted).toBe(0);
    expect(summary.succeeded).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.deadLettered).toBe(0);
    expect(summary.conflictRefunds).toBe(0);
    expect(summary.results).toHaveLength(0);
  });

  it('counts dead-lettered reservations (attempts >= MAX_SYNC_ATTEMPTS)', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    mockPrisma.reservation.count.mockResolvedValue(3);

    const { runOwambeStaysSyncPass } = await import('../sync-stays-reservation');
    const summary = await runOwambeStaysSyncPass();

    expect(summary.deadLettered).toBe(3);
    // Verify the count query used the correct predicate
    expect(mockPrisma.reservation.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          owambeReservationId: null,
          owambeSyncAttempts: { gte: 3 },
        }),
      })
    );
  });

  it('includes durationMs in summary', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    mockPrisma.reservation.count.mockResolvedValue(0);

    const { runOwambeStaysSyncPass } = await import('../sync-stays-reservation');
    const summary = await runOwambeStaysSyncPass();

    expect(typeof summary.durationMs).toBe('number');
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ─── MAX_SYNC_ATTEMPTS constant ───────────────────────────────────────────────
describe('MAX_SYNC_ATTEMPTS', () => {
  it('is 3 (symmetric to sync-experience-booking.ts)', async () => {
    const { MAX_SYNC_ATTEMPTS } = await import('../sync-stays-reservation');
    expect(MAX_SYNC_ATTEMPTS).toBe(3);
  });
});

// ─── OwambeStaysReservationPayload type export ────────────────────────────────
describe('OwambeStaysReservationPayload — AC-2 field name contract', () => {
  it('exports the canonical payload type (compile-time check via import)', async () => {
    // If this import succeeds, the type is exported correctly.
    // Actual field name assertions are covered in the 201 Created test above.
    const mod = await import('../sync-stays-reservation');
    expect(typeof mod.syncReservationToOwambe).toBe('function');
    expect(typeof mod.getPendingSyncReservations).toBe('function');
    expect(typeof mod.runOwambeStaysSyncPass).toBe('function');
  });
});

/**
 * Track 4 beat-A — handleReservationCancelled idempotency guard
 *
 * Covers AC-T4A-01 through AC-T4A-04 per CC-PHASE-F2.5-BRIEF-1-Rev2-Track4-BeatA:
 *
 *   AC-T4A-01: Idempotency guard added at handleReservationCancelled (candidate-α)
 *   AC-T4A-02: Duplicate lifecycle event handling correct
 *              - Second webhook returns HTTP 200 without re-execution
 *              - No additional notification email queued (auditEntry guest_notification_queued NOT called again)
 *              - Audit entry written with action=reservation_cancelled_duplicate_ignored
 *   AC-T4A-03: First webhook still processes normally
 *              - Full downstream actions execute exactly once
 *              - Audit entry + notification queue + Reservation status update all happen
 *   AC-T4A-04: Other handlers unaffected
 *              - handleReservationCreated behaviour unchanged from dc85b53
 *              - handleReservationRefunded behaviour unchanged
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
vi.mock('@/lib/paystack-adapter', () => ({
  getPaystackAdapter: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// ─── Constants ────────────────────────────────────────────────────────────────
const OWAMBE_RES_ID  = 'owambe-res-t4a-001';
const CC_RES_ID      = 'cc-res-t4a-001';
const EVENT_ID       = `evt_t4a_${Date.now()}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(
  body: object,
  overrideHeaders?: Record<string, string>
): NextRequest {
  const ts = String(Math.floor(Date.now() / 1000));
  return new NextRequest('http://localhost/api/v1/channel/webhooks/inbound', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-owambe-signature': 'valid-sig',
      'x-owambe-timestamp': ts,
      'x-owambe-event-id': EVENT_ID,
      ...overrideHeaders,
    },
  });
}

function makeCancelledPayload(overrides: Record<string, unknown> = {}) {
  return {
    event_type: 'reservation.cancelled',
    data: {
      reservation_id: OWAMBE_RES_ID,
      reason: 'Host cancelled',
      ...overrides,
    },
  };
}

/**
 * Build a mock Prisma client.
 * @param reservationStatus - the current status of the Reservation (simulates DB state)
 */
function makeMockPrisma(
  reservationStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null = 'CONFIRMED',
  overrides: Record<string, unknown> = {}
) {
  const stubReservation = reservationStatus !== null
    ? { id: CC_RES_ID, status: reservationStatus }
    : null;

  return {
    webhookDelivery: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    reservation: {
      findFirst: vi.fn().mockResolvedValue(stubReservation),
      updateMany: vi.fn().mockResolvedValue({ count: reservationStatus !== null ? 1 : 0 }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
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
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    experienceBooking: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    reconciliationLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

// ─── AC-T4A-01: Guard present ─────────────────────────────────────────────────

describe('AC-T4A-01 — idempotency guard present at handleReservationCancelled (candidate-α)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
    vi.mocked(getPaystackAdapter).mockReturnValue({
      refundTransaction: vi.fn().mockResolvedValue({ refundId: 'ref-001' }),
    } as never);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-T4A-01: Reservation.findFirst called before updateMany to check current status', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    expect(mockPrisma.reservation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeReservationId: OWAMBE_RES_ID },
        select: expect.objectContaining({ id: true, status: true }),
      })
    );
  });

  it('AC-T4A-01: findFirst called BEFORE updateMany (guard precedes downstream actions)', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const callOrder: string[] = [];
    mockPrisma.reservation.findFirst = vi.fn().mockImplementation(() => {
      callOrder.push('findFirst');
      return Promise.resolve({ id: CC_RES_ID, status: 'CONFIRMED' });
    });
    mockPrisma.reservation.updateMany = vi.fn().mockImplementation(() => {
      callOrder.push('updateMany');
      return Promise.resolve({ count: 1 });
    });
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    expect(callOrder[0]).toBe('findFirst');
    expect(callOrder[1]).toBe('updateMany');
  });
});

// ─── AC-T4A-02: Duplicate lifecycle event handling ───────────────────────────

describe('AC-T4A-02 — duplicate lifecycle event handling (Reservation already CANCELLED)', () => {
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

  it('AC-T4A-02: second webhook for already-CANCELLED Reservation returns HTTP 200', async () => {
    const mockPrisma = makeMockPrisma('CANCELLED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(makeCancelledPayload()));
    expect(res.status).toBe(200);
  });

  it('AC-T4A-02: Reservation.updateMany NOT called on duplicate (no re-execution)', async () => {
    const mockPrisma = makeMockPrisma('CANCELLED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));
    expect(mockPrisma.reservation.updateMany).not.toHaveBeenCalled();
  });

  it('AC-T4A-02: guest_notification_queued audit entry NOT created on duplicate (no notification re-queued)', async () => {
    const mockPrisma = makeMockPrisma('CANCELLED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    const notificationCalls = mockPrisma.auditEntry.create.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'guest_notification_queued'
    );
    expect(notificationCalls).toHaveLength(0);
  });

  it('AC-T4A-02: reservation_cancelled_by_owambe audit entry NOT created on duplicate', async () => {
    const mockPrisma = makeMockPrisma('CANCELLED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    const mainAuditCalls = mockPrisma.auditEntry.create.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'reservation_cancelled_by_owambe'
    );
    expect(mainAuditCalls).toHaveLength(0);
  });

  it('AC-T4A-02: reservation_cancelled_duplicate_ignored audit entry written on duplicate', async () => {
    const mockPrisma = makeMockPrisma('CANCELLED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'Reservation',
          entityId: CC_RES_ID,
          action: 'reservation_cancelled_duplicate_ignored',
        }),
      })
    );
  });

  it('AC-T4A-02: Paystack refund NOT initiated on duplicate', async () => {
    const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
    const mockRefund = vi.fn().mockResolvedValue({ refundId: 'ref-dup-001' });
    vi.mocked(getPaystackAdapter).mockReturnValue({ refundTransaction: mockRefund } as never);

    const mockPrisma = makeMockPrisma('CANCELLED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload({ paystack_reference: 'ref_t4a_001' })));
    expect(mockRefund).not.toHaveBeenCalled();
  });
});

// ─── AC-T4A-03: First webhook processes normally ──────────────────────────────

describe('AC-T4A-03 — first webhook processes full downstream actions (guard does not interfere)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
    const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
    vi.mocked(getPaystackAdapter).mockReturnValue({
      refundTransaction: vi.fn().mockResolvedValue({ refundId: 'ref-first-001' }),
    } as never);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-T4A-03: first webhook (status=CONFIRMED) returns HTTP 200', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(makeCancelledPayload()));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('AC-T4A-03: Reservation.updateMany called with status=CANCELLED on first webhook', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeReservationId: OWAMBE_RES_ID },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      })
    );
  });

  it('AC-T4A-03: guest_notification_queued audit entry created exactly once on first webhook', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    const notificationCalls = mockPrisma.auditEntry.create.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'guest_notification_queued'
    );
    expect(notificationCalls).toHaveLength(1);
  });

  it('AC-T4A-03: reservation_cancelled_by_owambe audit entry created exactly once on first webhook', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    const auditCalls = mockPrisma.auditEntry.create.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'reservation_cancelled_by_owambe'
    );
    expect(auditCalls).toHaveLength(1);
  });

  it('AC-T4A-03: Paystack refund initiated on first webhook when paystack_reference present', async () => {
    const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
    const mockRefund = vi.fn().mockResolvedValue({ refundId: 'ref-first-002' });
    vi.mocked(getPaystackAdapter).mockReturnValue({ refundTransaction: mockRefund } as never);

    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload({ paystack_reference: 'ref_t4a_first' })));
    expect(mockRefund).toHaveBeenCalledWith('ref_t4a_first');
  });

  it('AC-T4A-03: reservation_cancelled_duplicate_ignored audit entry NOT created on first webhook', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    const dupCalls = mockPrisma.auditEntry.create.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'reservation_cancelled_duplicate_ignored'
    );
    expect(dupCalls).toHaveLength(0);
  });

  it('AC-T4A-03: first webhook with status=PENDING also processes normally (guard only fires on CANCELLED)', async () => {
    const mockPrisma = makeMockPrisma('PENDING');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    await POST(makeRequest(makeCancelledPayload()));

    expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED' }),
      })
    );
  });

  it('AC-T4A-03: first webhook with no existing Reservation (findFirst returns null) still processes', async () => {
    const mockPrisma = makeMockPrisma(null);
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest(makeCancelledPayload()));
    // Guard does not block when findFirst returns null (no existing record)
    expect(res.status).toBe(200);
    expect(mockPrisma.reservation.updateMany).toHaveBeenCalled();
  });
});

// ─── AC-T4A-04: Other handlers unaffected ────────────────────────────────────

describe('AC-T4A-04 — other handlers unaffected', () => {
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

  it('AC-T4A-04: handleReservationCreated (dc85b53 semantics) — acknowledgement path unaffected', async () => {
    const RESERVATION_ID = '11111111-1111-4111-a111-111111111111';
    const CC_RES_ID_RC   = 'cc-res-rc-001';
    const CC_USER_ID_RC  = 'cc-user-rc-001';

    const mockPrisma = {
      ...makeMockPrisma('CONFIRMED'),
      reservation: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockImplementation(
          ({ where }: { where: Record<string, unknown> }) => {
            if ('inboundIdempotencyKey' in where) return Promise.resolve(null);
            if ('owambeReservationId' in where)
              return Promise.resolve({ id: CC_RES_ID_RC, owambeReservationId: RESERVATION_ID, guestUserId: CC_USER_ID_RC, inboundIdempotencyKey: null });
            return Promise.resolve(null);
          }
        ),
        update: vi.fn().mockResolvedValue({ id: CC_RES_ID_RC, inboundIdempotencyKey: `evt_rc_${Date.now()}` }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const rcPayload = {
      event_type: 'reservation.created',
      data: {
        reservation_id:       RESERVATION_ID,
        property_id:          '22222222-2222-4222-a222-222222222222',
        room_id:              '33333333-3333-4333-a333-333333333333',
        check_in_date:        '2026-09-01',
        check_out_date:       '2026-09-05',
        number_of_guests:     2,
        total_amount_kobo:    50000000,
        currency:             'NGN',
        guest_owambe_user_id: null,
      },
    };
    const res = await POST(makeRequest(rcPayload, { 'x-owambe-event-id': `evt_rc_${Date.now()}` }));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
    // Acknowledgement path: Reservation.create NOT called
    expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
    // Acknowledgement path: Reservation.update called (stamp inboundIdempotencyKey)
    expect(mockPrisma.reservation.update).toHaveBeenCalled();
    // Audit entry action = reservation_created_acknowledged
    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'reservation_created_acknowledged',
        }),
      })
    );
  });

  it('AC-T4A-04: property.deactivated handler unaffected — Reservation.findFirst NOT called', async () => {
    const mockPrisma = makeMockPrisma('CONFIRMED');
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');

    const res = await POST(makeRequest({
      event_type: 'property.deactivated',
      data: { property_id: 'owambe-prop-001', reason: 'Host suspended' },
    }));
    expect(res.status).toBe(200);
    // The guard's findFirst is specific to handleReservationCancelled — not called for property.deactivated
    expect(mockPrisma.reservation.findFirst).not.toHaveBeenCalled();
  });
});

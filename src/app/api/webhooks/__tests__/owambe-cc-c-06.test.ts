/**
 * CC-C-06 Behavioural tests — Owambe inbound webhook business logic
 *
 * Verifies the three CC-C-06 handler implementations:
 *   AC-1: property.deactivated → StayProperty.status=INACTIVE; reservations preserved
 *   AC-2: experience.deactivated → Experience.status=INACTIVE; bookings preserved
 *   AC-3: reservation.cancelled → CANCELLED + refund initiated/pending + notification queued
 *   AC-4: HMAC validation rejects invalid signatures with 401
 *   AC-5: Idempotency — duplicate event returns 200 + duplicate:true, no re-execution
 *   AC-6: Business logic is in code (verified by test observing state changes)
 *   AC-7: Audit log entry created on each event receipt
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
      'x-owambe-event-id': `evt_${Date.now()}_${Math.random()}`,
      ...overrideHeaders,
    },
  });
}

function makeMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    webhookDelivery: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    reservation: {
      findFirst: vi.fn().mockResolvedValue({ id: 'cc-res-mock-001', status: 'CONFIRMED' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    experienceBooking: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    stayProperty: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    experience: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    auditEntry: {
      create: vi.fn().mockResolvedValue({}),
    },
    reconciliationLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

// ─── Test setup ───────────────────────────────────────────────────────────────
describe('CC-C-06 — property.deactivated (AC-1, AC-6, AC-7)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-1: sets StayProperty.status=INACTIVE when property.deactivated is received', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'property.deactivated',
      data: { property_id: 'owambe-prop-001', reason: 'Host suspended' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);

    // AC-1: StayProperty updated to INACTIVE
    expect(mockPrisma.stayProperty.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambePropertyId: 'owambe-prop-001' },
        data: expect.objectContaining({ status: 'INACTIVE' }),
      })
    );
  });

  it('AC-1: does NOT update Reservation table when property.deactivated is received', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'property.deactivated',
      data: { property_id: 'owambe-prop-002' },
    });
    await POST(req);

    // AC-1: existing reservations remain untouched
    expect(mockPrisma.reservation.updateMany).not.toHaveBeenCalled();
  });

  it('AC-7: creates an audit log entry for property.deactivated', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'property.deactivated',
      data: { property_id: 'owambe-prop-003' },
    });
    await POST(req);

    // AC-7: audit log entry created
    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'StayProperty',
          entityId: 'owambe-prop-003',
          action: 'property_deactivated_by_owambe',
        }),
      })
    );
  });

  it('AC-1: returns 200 even when property_id is missing (logs warning, no crash)', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'property.deactivated',
      data: {}, // missing property_id
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    // No DB calls when property_id is missing
    expect(mockPrisma.stayProperty.updateMany).not.toHaveBeenCalled();
  });
});

describe('CC-C-06 — experience.deactivated (AC-2, AC-6, AC-7)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-2: sets Experience.status=INACTIVE when experience.deactivated is received', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'experience.deactivated',
      data: { experience_id: 'owambe-exp-001', reason: 'Operator suspended' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // AC-2: Experience updated to INACTIVE
    expect(mockPrisma.experience.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeExperienceId: 'owambe-exp-001' },
        data: expect.objectContaining({ status: 'INACTIVE' }),
      })
    );
  });

  it('AC-2: does NOT update ExperienceBooking table when experience.deactivated is received', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'experience.deactivated',
      data: { experience_id: 'owambe-exp-002' },
    });
    await POST(req);

    // AC-2: existing bookings remain untouched
    expect(mockPrisma.experienceBooking.updateMany).not.toHaveBeenCalled();
  });

  it('AC-7: creates an audit log entry for experience.deactivated', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'experience.deactivated',
      data: { experience_id: 'owambe-exp-003' },
    });
    await POST(req);

    // AC-7: audit log entry created
    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'Experience',
          entityId: 'owambe-exp-003',
          action: 'experience_deactivated_by_owambe',
        }),
      })
    );
  });
});

describe('CC-C-06 — reservation.cancelled (AC-3, AC-6, AC-7)', () => {
  beforeEach(async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-3: marks reservation CANCELLED with correct reason and initiator', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: {
        reservation_id: 'owambe-res-001',
        reason: 'Host unavailable for dates',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // AC-3: reservation marked CANCELLED
    expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owambeReservationId: 'owambe-res-001' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancellationReason: 'Host unavailable for dates',
          cancellationInitiatedBy: 'OWAMBE',
        }),
      })
    );
  });

  it('AC-3: uses default reason when reason is not provided', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: { reservation_id: 'owambe-res-002' },
    });
    await POST(req);

    expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cancellationReason: 'Cancelled by host via Owambe',
        }),
      })
    );
  });

  it('AC-3: initiates Paystack refund when paystack_reference is provided', async () => {
    const mockRefundTransaction = vi.fn().mockResolvedValue({
      refundId: 'ref_99001',
      status: 'pending',
      amountKobo: 250000,
    });
    const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
    vi.mocked(getPaystackAdapter).mockReturnValue({
      refundTransaction: mockRefundTransaction,
    } as never);

    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: {
        reservation_id: 'owambe-res-003',
        reason: 'Host cancelled',
        paystack_reference: 'ref_stay_003',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // AC-3: refund initiated
    expect(mockRefundTransaction).toHaveBeenCalledWith('ref_stay_003');
  });

  it('AC-3: sets refundStatus=no_payment_reference when paystack_reference is absent', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: { reservation_id: 'owambe-res-004', reason: 'Host cancelled' },
    });
    await POST(req);

    // Audit log should record refundStatus=no_payment_reference
    const auditCall = mockPrisma.auditEntry.create.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'reservation_cancelled_by_owambe'
    );
    expect(auditCall).toBeDefined();
    const metadata = JSON.parse((auditCall![0] as { data: { metadata: string } }).data.metadata);
    expect(metadata.refundStatus).toBe('no_payment_reference');
  });

  it('AC-3: queues guest notification audit entry', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: { reservation_id: 'owambe-res-005', reason: 'Host cancelled' },
    });
    await POST(req);

    // AC-3: guest notification queued
    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'Reservation',
          entityId: 'owambe-res-005',
          action: 'guest_notification_queued',
        }),
      })
    );
  });

  it('AC-7: creates reservation_cancelled_by_owambe audit log entry', async () => {
    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: { reservation_id: 'owambe-res-006', reason: 'Test cancellation' },
    });
    await POST(req);

    // AC-7: audit log entry created
    expect(mockPrisma.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'Reservation',
          entityId: 'owambe-res-006',
          action: 'reservation_cancelled_by_owambe',
        }),
      })
    );
  });

  it('AC-3: continues processing even if Paystack refund initiation fails', async () => {
    const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
    vi.mocked(getPaystackAdapter).mockReturnValue({
      refundTransaction: vi.fn().mockRejectedValue(new Error('Paystack API unavailable')),
    } as never);

    const mockPrisma = makeMockPrisma();
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: {
        reservation_id: 'owambe-res-007',
        paystack_reference: 'ref_stay_007',
      },
    });
    const res = await POST(req);
    // Should still return 200 — refund failure is logged as pending, not a fatal error
    expect(res.status).toBe(200);

    // Reservation should still be marked CANCELLED
    expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED' }),
      })
    );

    // Audit log should record refundStatus=pending
    const auditCall = mockPrisma.auditEntry.create.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'reservation_cancelled_by_owambe'
    );
    const metadata = JSON.parse((auditCall![0] as { data: { metadata: string } }).data.metadata);
    expect(metadata.refundStatus).toBe('pending');
  });
});

// ─── AC-4: HMAC validation rejects invalid signatures ─────────────────────────
describe('CC-C-06 — HMAC validation (AC-4)', () => {
  beforeEach(async () => {
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(false); // invalid signature
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-4: rejects property.deactivated with invalid signature (401)', async () => {
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'property.deactivated',
      data: { property_id: 'owambe-prop-sig-test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Invalid webhook signature');
  });

  it('AC-4: rejects experience.deactivated with invalid signature (401)', async () => {
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'experience.deactivated',
      data: { experience_id: 'owambe-exp-sig-test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('AC-4: rejects reservation.cancelled with invalid signature (401)', async () => {
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event_type: 'reservation.cancelled',
      data: { reservation_id: 'owambe-res-sig-test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

// ─── AC-5: Idempotency — duplicate events are not re-executed ─────────────────
describe('CC-C-06 — Idempotency (AC-5)', () => {
  beforeEach(async () => {
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('AC-5: returns 200 + duplicate:true for a duplicate property.deactivated event', async () => {
    const mockPrisma = {
      webhookDelivery: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing', eventId: 'evt_dup_prop' }),
        create: vi.fn(),
        update: vi.fn(),
      },
      stayProperty: { updateMany: vi.fn() },
      auditEntry: { create: vi.fn() },
    };
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest(
      { event_type: 'property.deactivated', data: { property_id: 'owambe-prop-dup' } },
      { 'x-owambe-event-id': 'evt_dup_prop' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);

    // AC-5: business logic NOT re-executed
    expect(mockPrisma.stayProperty.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.auditEntry.create).not.toHaveBeenCalled();
  });

  it('AC-5: returns 200 + duplicate:true for a duplicate experience.deactivated event', async () => {
    const mockPrisma = {
      webhookDelivery: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing', eventId: 'evt_dup_exp' }),
        create: vi.fn(),
        update: vi.fn(),
      },
      experience: { updateMany: vi.fn() },
      auditEntry: { create: vi.fn() },
    };
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest(
      { event_type: 'experience.deactivated', data: { experience_id: 'owambe-exp-dup' } },
      { 'x-owambe-event-id': 'evt_dup_exp' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);

    // AC-5: business logic NOT re-executed
    expect(mockPrisma.experience.updateMany).not.toHaveBeenCalled();
  });

  it('AC-5: returns 200 + duplicate:true for a duplicate reservation.cancelled event', async () => {
    const mockPrisma = {
      webhookDelivery: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing', eventId: 'evt_dup_res' }),
        create: vi.fn(),
        update: vi.fn(),
      },
      reservation: { updateMany: vi.fn() },
      auditEntry: { create: vi.fn() },
    };
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest(
      { event_type: 'reservation.cancelled', data: { reservation_id: 'owambe-res-dup' } },
      { 'x-owambe-event-id': 'evt_dup_res' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);

    // AC-5: business logic NOT re-executed
    expect(mockPrisma.reservation.updateMany).not.toHaveBeenCalled();
  });
});

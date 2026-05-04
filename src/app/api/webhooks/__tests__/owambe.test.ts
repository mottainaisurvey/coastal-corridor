/**
 * Integration tests for POST /api/v1/channel/webhooks/inbound
 *
 * Covers:
 *   - Valid signature + known event → 200 + received:true
 *   - Invalid signature → 401
 *   - Missing required headers → 400
 *   - Duplicate event (already in WebhookDelivery) → 200 + duplicate:true
 *   - Unknown event type → 200 (logged, not errored)
 *   - All 12 OpenAPI spec contract events are routed without throwing
 *   - 5 supplementary events (not in spec) are also handled gracefully
 *
 * The handler imports getPrisma from db-safe and verifyInboundWebhook from hmac.
 * Both are mocked to isolate the handler from infrastructure dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/db-safe', () => ({
  getPrisma: vi.fn(),
}));

vi.mock('@/lib/hmac', () => ({
  verifyInboundWebhook: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'test-inbound-secret';

function makeRequest(
  body: object,
  overrideHeaders?: Record<string, string>
): NextRequest {
  const ts = String(Math.floor(Date.now() / 1000));
  const bodyStr = JSON.stringify(body);
  const sig = createHmac('sha256', WEBHOOK_SECRET)
    .update(`${ts}.${bodyStr}`, 'utf8')
    .digest('hex');

  return new NextRequest('http://localhost/api/v1/channel/webhooks/inbound', {
    method: 'POST',
    body: bodyStr,
    headers: {
      'content-type': 'application/json',
      'x-owambe-signature': sig,
      'x-owambe-timestamp': ts,
      'x-owambe-event-id': `evt_${Date.now()}`,
      ...overrideHeaders,
    },
  });
}

/** Creates a mock Prisma instance where the event has NOT been seen before. */
function makeMockPrismaFresh() {
  return {
    webhookDelivery: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    reservation: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    experienceBooking: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    stayProperty: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    experience: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    reconciliationLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

/** Creates a mock Prisma instance where the event HAS already been processed. */
function makeMockPrismaDuplicate() {
  return {
    webhookDelivery: {
      findUnique: vi.fn().mockResolvedValue({ id: 'existing', eventId: 'evt_dup' }),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/channel/webhooks/inbound', () => {
  beforeEach(async () => {
    vi.stubEnv('OWAMBE_WEBHOOK_SECRET', WEBHOOK_SECRET);
    // Default: signature is valid
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('returns 400 when required headers are missing', async () => {
    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = new NextRequest('http://localhost/api/v1/channel/webhooks/inbound', {
      method: 'POST',
      body: JSON.stringify({ event: 'reservation.cancelled', data: {} }),
      headers: { 'content-type': 'application/json' },
      // No x-owambe-signature, x-owambe-timestamp, x-owambe-event-id
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Missing required webhook headers');
  });

  it('returns 401 when the signature is invalid', async () => {
    const { verifyInboundWebhook } = await import('@/lib/hmac');
    vi.mocked(verifyInboundWebhook).mockReturnValue(false);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({ event: 'reservation.cancelled', data: {} });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Invalid webhook signature');
  });

  it('returns 200 with received:true for a valid reservation.cancelled event', async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(makeMockPrismaFresh() as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event: 'reservation.cancelled',
      data: { reservation_id: 'owambe-res-001', reason: 'Guest request' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.duplicate).toBeUndefined();
  });

  it('returns 200 with duplicate:true for a duplicate event', async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(makeMockPrismaDuplicate() as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest(
      { event: 'reservation.cancelled', data: { reservation_id: 'owambe-res-001' } },
      { 'x-owambe-event-id': 'evt_dup' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);
  });

  it('returns 200 for an unknown event type (logs and acknowledges)', async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(makeMockPrismaFresh() as never);

    const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
    const req = makeRequest({
      event: 'unknown.event.type',
      data: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  // ─── 12 OpenAPI spec contract events ──────────────────────────────────────
  // These are the events Owambe's webhook publisher actually emits per the API contract.

  const contractEventTypes = [
    // Stays (5 events)
    { event: 'reservation.cancelled',        data: { reservation_id: 'r1', reason: 'Guest request' } },
    { event: 'reservation.no_show',          data: { reservation_id: 'r2' } },
    { event: 'reservation.guest_checked_in', data: { reservation_id: 'r3' } },
    { event: 'reservation.guest_checked_out',data: { reservation_id: 'r4' } },
    { event: 'reservation.refunded',         data: { reservation_id: 'r5', refund_amount: 50000 } },
    // Experiences (4 events)
    { event: 'booking.cancelled',            data: { booking_id: 'b1', reason: 'Operator unavailable' } },
    { event: 'booking.no_show',              data: { booking_id: 'b2' } },
    { event: 'booking.completed',            data: { booking_id: 'b3' } },
    { event: 'booking.refunded',             data: { booking_id: 'b4', refund_amount: 25000 } },
    // Inventory (2 events)
    { event: 'property.deactivated',         data: { property_id: 'p1' } },
    { event: 'experience.deactivated',       data: { experience_id: 'e1' } },
    // Reconciliation (1 event)
    { event: 'reconciliation.requested',     data: { scope: 'STAYS' } },
  ];

  contractEventTypes.forEach(({ event, data }) => {
    it(`[contract] handles "${event}" without throwing`, async () => {
      const { getPrisma } = await import('@/lib/db-safe');
      vi.mocked(getPrisma).mockReturnValue(makeMockPrismaFresh() as never);

      const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
      const req = makeRequest({ event, data });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
    });
  });

  // ─── 5 supplementary events (NOT in OpenAPI spec) ─────────────────────────
  // Owambe does not emit these. They are retained for internal state management.

  const supplementaryEventTypes = [
    { event: 'reservation.confirmed', data: { reservation_id: 'r10' } },
    { event: 'booking.confirmed',     data: { booking_id: 'b10' } },
    { event: 'property.updated',      data: { property_id: 'p10' } },
    { event: 'experience.updated',    data: { experience_id: 'e10' } },
    { event: 'availability.updated',  data: { room_id: 'room10', dates: [] } },
  ];

  supplementaryEventTypes.forEach(({ event, data }) => {
    it(`[supplementary] handles "${event}" without throwing`, async () => {
      const { getPrisma } = await import('@/lib/db-safe');
      vi.mocked(getPrisma).mockReturnValue(makeMockPrismaFresh() as never);

      const { POST } = await import('@/app/api/v1/channel/webhooks/inbound/route');
      const req = makeRequest({ event, data });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
    });
  });
});

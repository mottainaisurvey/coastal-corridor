/**
 * CC-C-07 Route Integration Tests
 *
 * Covers acceptance criteria for:
 *   POST /api/v1/channel/stays/reservations
 *   POST /api/v1/channel/experiences/bookings
 *
 * AC-1: CommissionCalculator.calculate() called with correct vertical
 * AC-2: Commission fields persisted on reservation/booking row
 * AC-3: Negotiated rate (from HostProfile.commissionRate) overrides default
 * AC-4: Cohort default applied when isCohortMember=true and no negotiated rate
 * AC-5: Standard default applied when isCohortMember=false and no negotiated rate
 * AC-6: AuditEntry created with commission breakdown in metadata
 * AC-7: Idempotency guard returns cached response on duplicate key
 *
 * Additional:
 *   - 400 when required headers are missing
 *   - 401 when HMAC signature is invalid
 *   - 422 when required payload fields are missing
 *   - 404 when property/room/guest/experience/time-slot not found
 *   - 422 when room does not belong to property
 *   - 503 when database is unavailable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@/lib/channel-auth', () => ({
  verifyChannelRequest: vi.fn(),
}));
vi.mock('@/lib/db-safe', () => ({
  getPrismaClient: vi.fn(),
}));
vi.mock('@/lib/commission', () => ({
  getCommissionCalculator: vi.fn(),
}));

import { verifyChannelRequest } from '@/lib/channel-auth';
import { getPrismaClient } from '@/lib/db-safe';
import { getCommissionCalculator } from '@/lib/commission';
import { POST as staysReservationsPost } from '@/app/api/v1/channel/stays/reservations/route';
import { POST as experiencesBookingsPost } from '@/app/api/v1/channel/experiences/bookings/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeReq(url: string, body?: object): NextRequest {
  const bodyStr = body ? JSON.stringify(body) : '';
  const req = new NextRequest(url, {
    method: 'POST',
    body: bodyStr || undefined,
    headers: {
      'content-type': 'application/json',
      'x-owambe-signature': 'sig_valid',
      'x-owambe-timestamp': String(Math.floor(Date.now() / 1000)),
      'x-idempotency-key': `idem_${Date.now()}_${Math.random()}`,
    },
  });
  // Store body string on the request for use by guardOk
  (req as NextRequest & { _bodyStr: string })._bodyStr = bodyStr;
  return req;
}

function guardOk(idempotencyKey?: string) {
  vi.mocked(verifyChannelRequest).mockImplementation(async (req: NextRequest) => {
    const rawBody = (req as NextRequest & { _bodyStr?: string })._bodyStr ?? await req.text();
    return {
      error: null,
      rawBody,
      idempotencyKey: idempotencyKey ?? `idem_${Date.now()}_${Math.random()}`,
    } as ReturnType<typeof verifyChannelRequest> extends Promise<infer T> ? T : never;
  });
}

function guardFail(status: number, message: string) {
  const { NextResponse } = require('next/server');
  vi.mocked(verifyChannelRequest).mockResolvedValue({
    error: NextResponse.json({ error: message }, { status }),
  } as ReturnType<typeof verifyChannelRequest> extends Promise<infer T> ? T : never);
}

const MOCK_COMMISSION_RESULT = {
  rateApplied: 0.12,
  ratePercent: 12,
  channelCommissionSmallestUnit: 12_000,
  netToHostSmallestUnit: 88_000,
  breakdown: 'vertical=STAYS currency=NGN total=100000 rate=12.00% (cohort_default) commission=12000 net=88000',
  rateSource: 'cohort_default',
};

const MOCK_CALCULATOR = {
  calculate: vi.fn().mockReturnValue(MOCK_COMMISSION_RESULT),
};

// ─── Shared DB mock factory ───────────────────────────────────────────────────
function makeDb(overrides: Record<string, unknown> = {}) {
  const idempotencyKey = `idem_${Date.now()}_${Math.random()}`;
  return {
    idempotencyCache: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    stayProperty: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'prop_id_1',
        owambePropertyId: 'owb_prop_uuid',
        host: {
          id: 'user_host_1',
          cohortMember: true,
          hostProfile: { commissionRate: null },
        },
      }),
    },
    room: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'room_id_1',
        owambeRoomId: 'owb_room_uuid',
        propertyId: 'prop_id_1',
      }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user_guest_1',
        owambeUserId: 'owb_user_uuid',
      }),
    },
    reservation: {
      create: vi.fn().mockResolvedValue({
        id: 'res_id_1',
        owambeReservationId: 'owb_res_uuid',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: new Date('2026-05-11T00:00:00Z'),
      }),
    },
    auditEntry: {
      create: vi.fn().mockResolvedValue({}),
    },
    experience: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'exp_id_1',
        owambeExperienceId: 'owb_exp_uuid',
        operator: {
          id: 'user_op_1',
          cohortMember: false,
          operatorProfile: { commissionRate: null },
        },
      }),
    },
    timeSlot: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'slot_id_1',
        owambeTimeSlotId: 'owb_slot_uuid',
        experienceId: 'exp_id_1',
      }),
    },
    experienceBooking: {
      create: vi.fn().mockResolvedValue({
        id: 'booking_id_1',
        owambeBookingId: 'owb_booking_uuid',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: new Date('2026-05-11T00:00:00Z'),
      }),
    },
    ...overrides,
  };
}

const VALID_STAYS_BODY = {
  owambe_reservation_id: 'owb_res_uuid',
  owambe_property_id: 'owb_prop_uuid',
  owambe_room_id: 'owb_room_uuid',
  guest_owambe_user_id: 'owb_user_uuid',
  check_in_date: '2026-07-01',
  check_out_date: '2026-07-05',
  number_of_guests: 2,
  total_amount: 1000.00,
  currency: 'NGN',
};

const VALID_EXPERIENCES_BODY = {
  owambe_booking_id: 'owb_booking_uuid',
  owambe_experience_id: 'owb_exp_uuid',
  owambe_time_slot_id: 'owb_slot_uuid',
  participant_owambe_user_id: 'owb_user_uuid',
  number_of_participants: 2,
  total_amount: 500.00,
  currency: 'NGN',
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAYS RESERVATIONS
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/channel/stays/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCommissionCalculator).mockReturnValue(MOCK_CALCULATOR as ReturnType<typeof getCommissionCalculator>);
  });

  // ── Auth errors ─────────────────────────────────────────────────────────────
  it('returns 400 when required headers are missing', async () => {
    guardFail(400, 'Missing required headers');
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when HMAC signature is invalid', async () => {
    guardFail(401, 'Invalid signature');
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(401);
  });

  // ── DB unavailable ──────────────────────────────────────────────────────────
  it('returns 503 when database is unavailable', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(null);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(503);
  });

  // ── Validation ──────────────────────────────────────────────────────────────
  it('returns 422 when required fields are missing', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', {
      owambe_property_id: 'owb_prop_uuid',
      // missing: owambe_room_id, guest_owambe_user_id, check_in_date, etc.
    });
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.missing).toContain('owambe_room_id');
    expect(body.missing).toContain('guest_owambe_user_id');
  });

  it('returns 422 for invalid currency', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', {
      ...VALID_STAYS_BODY,
      currency: 'EUR',
    });
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('Invalid currency');
  });

  // ── 404 errors ──────────────────────────────────────────────────────────────
  it('returns 404 when property not found', async () => {
    guardOk();
    const db = makeDb();
    (db.stayProperty.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Property not found');
  });

  it('returns 404 when room not found', async () => {
    guardOk();
    const db = makeDb();
    (db.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Room not found');
  });

  it('returns 404 when guest not found', async () => {
    guardOk();
    const db = makeDb();
    (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Guest not found');
  });

  it('returns 422 when room does not belong to property', async () => {
    guardOk();
    const db = makeDb();
    (db.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'room_id_other',
      owambeRoomId: 'owb_room_uuid',
      propertyId: 'prop_id_DIFFERENT',
    });
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('Room does not belong');
  });

  // ── AC-1: CommissionCalculator called with vertical=STAYS ──────────────────
  it('AC-1: calls CommissionCalculator.calculate() with vertical=STAYS', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    await staysReservationsPost(req);
    expect(MOCK_CALCULATOR.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ vertical: 'STAYS' })
    );
  });

  // ── AC-4: Cohort default (12%) when isCohortMember=true ────────────────────
  it('AC-4: passes isCohortMember=true to calculator when host is cohort member', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    await staysReservationsPost(req);
    expect(MOCK_CALCULATOR.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ isCohortMember: true })
    );
  });

  // ── AC-5: Standard default (15%) when isCohortMember=false ─────────────────
  it('AC-5: passes isCohortMember=false to calculator when host is not cohort member', async () => {
    guardOk();
    const db = makeDb();
    (db.stayProperty.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'prop_id_1',
      owambePropertyId: 'owb_prop_uuid',
      host: {
        id: 'user_host_1',
        cohortMember: false,
        hostProfile: { commissionRate: null },
      },
    });
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    await staysReservationsPost(req);
    expect(MOCK_CALCULATOR.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ isCohortMember: false })
    );
  });

  // ── AC-3: Negotiated rate passed when HostProfile.commissionRate is set ─────
  it('AC-3: passes negotiatedRate to calculator when HostProfile.commissionRate is set', async () => {
    guardOk();
    const db = makeDb();
    (db.stayProperty.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'prop_id_1',
      owambePropertyId: 'owb_prop_uuid',
      host: {
        id: 'user_host_1',
        cohortMember: true,
        hostProfile: { commissionRate: 0.10 }, // 10% negotiated
      },
    });
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    await staysReservationsPost(req);
    expect(MOCK_CALCULATOR.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ negotiatedRate: 0.10 })
    );
  });

  // ── AC-2: Commission fields persisted on Reservation row ───────────────────
  it('AC-2: persists channelCommissionAmount, channelCommissionPercent, netToHost on reservation', async () => {
    guardOk();
    const db = makeDb();
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    await staysReservationsPost(req);
    expect(db.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channelCommissionAmount: '120.00',  // 12000 / 100
          channelCommissionPercent: '12.00',
          netToHost: '880.00',               // 88000 / 100
        }),
      })
    );
  });

  // ── AC-6: AuditEntry created with commission breakdown ─────────────────────
  it('AC-6: creates AuditEntry with commission breakdown in metadata', async () => {
    guardOk();
    const db = makeDb();
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    await staysReservationsPost(req);
    expect(db.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'create',
          entityType: 'Reservation',
        }),
      })
    );
    const auditCall = (db.auditEntry.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const metadata = JSON.parse(auditCall.data.metadata);
    expect(metadata.event).toBe('reservation_created');
    expect(metadata.commissionBreakdown).toContain('vertical=STAYS');
  });

  // ── AC-7: Idempotency guard ─────────────────────────────────────────────────
  it('AC-7: returns cached response with duplicate=true on duplicate idempotency key', async () => {
    const cachedBody = { id: 'res_id_cached', status: 'PENDING', payment_status: 'PENDING' };
    guardOk('idem_dup_key');
    const db = makeDb();
    (db.idempotencyCache.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      idempotencyKey: 'idem_dup_key',
      responseBody: Buffer.from(JSON.stringify(cachedBody), 'utf8'),
      responseStatus: 201,
    });
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
    expect(db.reservation.create).not.toHaveBeenCalled();
  });

  // ── Success ─────────────────────────────────────────────────────────────────
  it('returns 201 with commission fields on successful reservation creation', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/stays/reservations', VALID_STAYS_BODY);
    const res = await staysReservationsPost(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.channel_commission_amount).toBe('120.00');
    expect(body.channel_commission_percent).toBe('12.00');
    expect(body.net_to_host).toBe('880.00');
    expect(body.status).toBe('PENDING');
    expect(body.payment_status).toBe('PENDING');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCES BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/channel/experiences/bookings', () => {
  const MOCK_EXP_COMMISSION_RESULT = {
    rateApplied: 0.18,
    ratePercent: 18,
    channelCommissionSmallestUnit: 9_000,
    netToHostSmallestUnit: 41_000,
    breakdown: 'vertical=EXPERIENCES currency=NGN total=50000 rate=18.00% (standard_default) commission=9000 net=41000',
    rateSource: 'standard_default',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCommissionCalculator).mockReturnValue({
      calculate: vi.fn().mockReturnValue(MOCK_EXP_COMMISSION_RESULT),
    } as ReturnType<typeof getCommissionCalculator>);
  });

  it('returns 400 when required headers are missing', async () => {
    guardFail(400, 'Missing required headers');
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when HMAC signature is invalid', async () => {
    guardFail(401, 'Invalid signature');
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(401);
  });

  it('returns 503 when database is unavailable', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(null);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(503);
  });

  it('returns 422 when required fields are missing', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', {
      owambe_experience_id: 'owb_exp_uuid',
      // missing: owambe_time_slot_id, participant_owambe_user_id, etc.
    });
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.missing).toContain('owambe_time_slot_id');
    expect(body.missing).toContain('participant_owambe_user_id');
  });

  it('returns 404 when experience not found', async () => {
    guardOk();
    const db = makeDb();
    (db.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Experience not found');
  });

  it('returns 404 when time slot not found', async () => {
    guardOk();
    const db = makeDb();
    (db.timeSlot.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Time slot not found');
  });

  it('returns 422 when time slot does not belong to experience', async () => {
    guardOk();
    const db = makeDb();
    (db.timeSlot.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'slot_id_other',
      owambeTimeSlotId: 'owb_slot_uuid',
      experienceId: 'exp_id_DIFFERENT',
    });
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('Time slot does not belong');
  });

  // ── AC-1: CommissionCalculator called with vertical=EXPERIENCES ─────────────
  it('AC-1: calls CommissionCalculator.calculate() with vertical=EXPERIENCES', async () => {
    guardOk();
    const db = makeDb();
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const calcMock = vi.mocked(getCommissionCalculator)();
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    await experiencesBookingsPost(req);
    expect(calcMock.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ vertical: 'EXPERIENCES' })
    );
  });

  // ── AC-5: Standard default (18%) when isCohortMember=false ─────────────────
  it('AC-5: passes isCohortMember=false to calculator when operator is not cohort member', async () => {
    guardOk();
    const db = makeDb();
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const calcMock = vi.mocked(getCommissionCalculator)();
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    await experiencesBookingsPost(req);
    expect(calcMock.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ isCohortMember: false })
    );
  });

  // ── AC-2: Commission fields persisted on ExperienceBooking row ──────────────
  it('AC-2: persists channelCommissionAmount, channelCommissionPercent, netToOperator on booking', async () => {
    guardOk();
    const db = makeDb();
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    await experiencesBookingsPost(req);
    expect(db.experienceBooking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channelCommissionAmount: '90.00',  // 9000 / 100
          channelCommissionPercent: '18.00',
          netToOperator: '410.00',           // 41000 / 100
        }),
      })
    );
  });

  // ── AC-6: AuditEntry created with commission breakdown ─────────────────────
  it('AC-6: creates AuditEntry with commission breakdown in metadata', async () => {
    guardOk();
    const db = makeDb();
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    await experiencesBookingsPost(req);
    expect(db.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'create',
          entityType: 'ExperienceBooking',
        }),
      })
    );
    const auditCall = (db.auditEntry.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const metadata = JSON.parse(auditCall.data.metadata);
    expect(metadata.event).toBe('experience_booking_created');
    expect(metadata.commissionBreakdown).toContain('vertical=EXPERIENCES');
  });

  // ── AC-7: Idempotency guard ─────────────────────────────────────────────────
  it('AC-7: returns cached response with duplicate=true on duplicate idempotency key', async () => {
    const cachedBody = { id: 'booking_id_cached', status: 'PENDING', payment_status: 'PENDING' };
    guardOk('idem_dup_key_exp');
    const db = makeDb();
    (db.idempotencyCache.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      idempotencyKey: 'idem_dup_key_exp',
      responseBody: Buffer.from(JSON.stringify(cachedBody), 'utf8'),
      responseStatus: 201,
    });
    vi.mocked(getPrismaClient).mockReturnValue(db as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
    expect(db.experienceBooking.create).not.toHaveBeenCalled();
  });

  // ── Success ─────────────────────────────────────────────────────────────────
  it('returns 201 with commission fields on successful booking creation', async () => {
    guardOk();
    vi.mocked(getPrismaClient).mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('http://localhost/api/v1/channel/experiences/bookings', VALID_EXPERIENCES_BODY);
    const res = await experiencesBookingsPost(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.channel_commission_amount).toBe('90.00');
    expect(body.channel_commission_percent).toBe('18.00');
    expect(body.net_to_operator).toBe('410.00');
    expect(body.status).toBe('PENDING');
  });
});

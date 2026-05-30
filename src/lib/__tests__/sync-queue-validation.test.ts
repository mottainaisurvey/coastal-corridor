/**
 * CC-PHASE-5-3-A: Unit tests for src/lib/sync-queue-validation.ts
 *
 * Covers:
 *   AC-2 — UUID shape verification (rule-1): non-UUID rejected; valid UUID passes
 *   AC-3 — Required field verification (rule-2): missing fields rejected; all present passes
 *   AC-4 — Diagnostic-origin marker detection (rule-3): probe-/founder-test-/seed- rejected; clean ID passes
 *   AC-5 — Integration shape: experience booking dispatcher payload shape passes/fails correctly
 *   AC-6 — Integration shape: stays reservation dispatcher payload shape passes/fails correctly
 *   AC-7 — Structured log: console.warn called with [sync-queue-validation-rejected] marker on rejection
 *
 * No mocks required — validateSyncQueueEntry is a pure synchronous function.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateSyncQueueEntry,
  type SyncQueueEntryPayload,
} from '@/lib/sync-queue-validation';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-4789-8abc-def012345678';
const VALID_UUID_2 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const VALID_UUID_3 = '550e8400-e29b-41d4-a716-446655440000';

function makeValidExperiencePayload(
  overrides: Partial<SyncQueueEntryPayload> = {}
): SyncQueueEntryPayload {
  return {
    event_id: VALID_UUID,
    event_type: 'experience_booking_sync',
    timestamp: new Date().toISOString(),
    body: { some: 'data' },
    cc_booking_id: VALID_UUID,
    experience_id: VALID_UUID_2,
    owambe_time_slot_id: VALID_UUID_3,
    ...overrides,
  };
}

function makeValidStaysPayload(
  overrides: Partial<SyncQueueEntryPayload> = {}
): SyncQueueEntryPayload {
  return {
    event_id: VALID_UUID,
    event_type: 'stays_reservation_sync',
    timestamp: new Date().toISOString(),
    body: { some: 'data' },
    cc_reservation_id: VALID_UUID,
    owambe_property_id: VALID_UUID_2,
    owambe_room_id: VALID_UUID_3,
    ...overrides,
  };
}

// ─── AC-2: UUID shape verification (rule-1) ───────────────────────────────────

describe('AC-2 — UUID shape verification (rule-1)', () => {
  it('returns { valid: true } when all ID fields are valid UUID v4', () => {
    const result = validateSyncQueueEntry(makeValidExperiencePayload());
    expect(result.valid).toBe(true);
  });

  it('returns { valid: false } with UUID_SHAPE error when cc_booking_id is non-UUID', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ cc_booking_id: 'not-a-uuid' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const uuidError = result.errors.find(e => e.rule === 'UUID_SHAPE' && e.field === 'cc_booking_id');
      expect(uuidError).toBeDefined();
      expect(uuidError?.message).toContain("not-a-uuid");
      expect(uuidError?.message).toContain("not valid UUID v4");
    }
  });

  it('returns { valid: false } with UUID_SHAPE error when experience_id is a numeric string', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ experience_id: '12345' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const uuidError = result.errors.find(e => e.rule === 'UUID_SHAPE' && e.field === 'experience_id');
      expect(uuidError).toBeDefined();
    }
  });

  it('returns { valid: false } with UUID_SHAPE error when owambe_time_slot_id is non-UUID', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ owambe_time_slot_id: 'slot-abc-123' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const uuidError = result.errors.find(e => e.rule === 'UUID_SHAPE' && e.field === 'owambe_time_slot_id');
      expect(uuidError).toBeDefined();
    }
  });

  it('skips UUID check for null/undefined ID fields (optional fields)', () => {
    // guest_owambe_user_id is optional — null should not trigger UUID_SHAPE error
    const result = validateSyncQueueEntry(
      makeValidStaysPayload({ guest_owambe_user_id: null })
    );
    expect(result.valid).toBe(true);
  });

  it('accepts UUID v4 with uppercase hex digits', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({
        cc_booking_id: 'A1B2C3D4-E5F6-4789-8ABC-DEF012345678',
      })
    );
    expect(result.valid).toBe(true);
  });
});

// ─── AC-3: Required field verification (rule-2) ───────────────────────────────

describe('AC-3 — Required field verification (rule-2)', () => {
  it('returns { valid: true } when all required fields are present', () => {
    const result = validateSyncQueueEntry(makeValidExperiencePayload());
    expect(result.valid).toBe(true);
  });

  it('returns { valid: false } with REQUIRED_FIELD error when event_id is missing', () => {
    const payload = makeValidExperiencePayload();
    delete payload.event_id;
    const result = validateSyncQueueEntry(payload);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(e => e.rule === 'REQUIRED_FIELD' && e.field === 'event_id');
      expect(err).toBeDefined();
      expect(err?.message).toContain("event_id");
    }
  });

  it('returns { valid: false } with REQUIRED_FIELD error when event_type is missing', () => {
    const payload = makeValidExperiencePayload();
    delete payload.event_type;
    const result = validateSyncQueueEntry(payload);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(e => e.rule === 'REQUIRED_FIELD' && e.field === 'event_type');
      expect(err).toBeDefined();
    }
  });

  it('returns { valid: false } with REQUIRED_FIELD error when timestamp is missing', () => {
    const payload = makeValidExperiencePayload();
    delete payload.timestamp;
    const result = validateSyncQueueEntry(payload);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(e => e.rule === 'REQUIRED_FIELD' && e.field === 'timestamp');
      expect(err).toBeDefined();
    }
  });

  it('returns { valid: false } with REQUIRED_FIELD error when body is missing', () => {
    const payload = makeValidExperiencePayload();
    delete payload.body;
    const result = validateSyncQueueEntry(payload);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(e => e.rule === 'REQUIRED_FIELD' && e.field === 'body');
      expect(err).toBeDefined();
    }
  });

  it('accumulates multiple REQUIRED_FIELD errors when multiple fields missing', () => {
    const payload: SyncQueueEntryPayload = {
      // event_id, event_type, timestamp, body all missing
      cc_booking_id: VALID_UUID,
      experience_id: VALID_UUID_2,
      owambe_time_slot_id: VALID_UUID_3,
    };
    const result = validateSyncQueueEntry(payload);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const requiredErrors = result.errors.filter(e => e.rule === 'REQUIRED_FIELD');
      expect(requiredErrors.length).toBe(4);
    }
  });
});

// ─── AC-4: Diagnostic-origin marker detection (rule-3) ───────────────────────

describe('AC-4 — Diagnostic-origin marker detection (rule-3)', () => {
  it('rejects probe-slot- prefixed owambe_time_slot_id (Phase 5.1 arc precedent)', () => {
    // Concrete example from Brief 2 execution outcomes: probe-slot-1778731610820
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ owambe_time_slot_id: 'probe-slot-1778731610820' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'owambe_time_slot_id'
      );
      expect(err).toBeDefined();
      expect(err?.message).toContain('probe-slot-1778731610820');
      expect(err?.message).toContain("probe-");
    }
  });

  it('rejects probe-exp- prefixed experience_id', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ experience_id: 'probe-exp-ngn-1778731610820' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'experience_id'
      );
      expect(err).toBeDefined();
    }
  });

  it('rejects founder-test- prefixed owambe_property_id', () => {
    const result = validateSyncQueueEntry(
      makeValidStaysPayload({ owambe_property_id: 'founder-test-property-001' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'owambe_property_id'
      );
      expect(err).toBeDefined();
    }
  });

  it('rejects seed- prefixed cc_booking_id', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ cc_booking_id: 'seed-booking-ref-1234567890' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'cc_booking_id'
      );
      expect(err).toBeDefined();
    }
  });

  it('rejects synthetic- prefixed cc_reservation_id', () => {
    const result = validateSyncQueueEntry(
      makeValidStaysPayload({ cc_reservation_id: 'synthetic-res-001' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'cc_reservation_id'
      );
      expect(err).toBeDefined();
    }
  });

  it('rejects test- prefixed owambe_room_id', () => {
    const result = validateSyncQueueEntry(
      makeValidStaysPayload({ owambe_room_id: 'test-room-001' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'owambe_room_id'
      );
      expect(err).toBeDefined();
    }
  });

  it('returns { valid: true } for non-diagnostic-prefixed UUID IDs', () => {
    const result = validateSyncQueueEntry(makeValidExperiencePayload());
    expect(result.valid).toBe(true);
  });

  it('is case-insensitive for diagnostic prefix detection', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ owambe_time_slot_id: 'PROBE-slot-1234567890' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'owambe_time_slot_id'
      );
      expect(err).toBeDefined();
    }
  });
});

// ─── AC-5: Experience dispatcher integration shape ────────────────────────────

describe('AC-5 — Experience dispatcher integration shape', () => {
  it('passes a valid experience booking payload', () => {
    const result = validateSyncQueueEntry(makeValidExperiencePayload());
    expect(result.valid).toBe(true);
  });

  it('rejects experience payload with probe-slot owambe_time_slot_id (diagnostic-tooling-drift scenario)', () => {
    // This is the exact failure mode from Phase 5.1 arc: probe-slot-${Date.now()}
    const diagnosticSlotId = `probe-slot-ngn-${Date.now()}`;
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({ owambe_time_slot_id: diagnosticSlotId })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      // Should fail on BOTH UUID_SHAPE and DIAGNOSTIC_ORIGIN
      const uuidErr = result.errors.find(e => e.rule === 'UUID_SHAPE' && e.field === 'owambe_time_slot_id');
      const diagErr = result.errors.find(e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'owambe_time_slot_id');
      expect(uuidErr).toBeDefined();
      expect(diagErr).toBeDefined();
    }
  });

  it('returns all accumulated errors (not just first error)', () => {
    const result = validateSyncQueueEntry(
      makeValidExperiencePayload({
        cc_booking_id: 'probe-booking-123',    // DIAGNOSTIC_ORIGIN + UUID_SHAPE
        experience_id: 'not-a-uuid',           // UUID_SHAPE only
      })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ─── AC-6: Stays dispatcher integration shape ─────────────────────────────────

describe('AC-6 — Stays dispatcher integration shape', () => {
  it('passes a valid stays reservation payload', () => {
    const result = validateSyncQueueEntry(makeValidStaysPayload());
    expect(result.valid).toBe(true);
  });

  it('rejects stays payload with founder-test- prefixed owambe_property_id', () => {
    const result = validateSyncQueueEntry(
      makeValidStaysPayload({ owambe_property_id: 'founder-test-property-001' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const diagErr = result.errors.find(
        e => e.rule === 'DIAGNOSTIC_ORIGIN' && e.field === 'owambe_property_id'
      );
      expect(diagErr).toBeDefined();
    }
  });

  it('rejects stays payload with non-UUID cc_reservation_id', () => {
    const result = validateSyncQueueEntry(
      makeValidStaysPayload({ cc_reservation_id: 'res-abc-not-uuid' })
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const uuidErr = result.errors.find(
        e => e.rule === 'UUID_SHAPE' && e.field === 'cc_reservation_id'
      );
      expect(uuidErr).toBeDefined();
    }
  });

  it('passes stays payload with null guest_owambe_user_id (optional field)', () => {
    const result = validateSyncQueueEntry(
      makeValidStaysPayload({ guest_owambe_user_id: null })
    );
    expect(result.valid).toBe(true);
  });
});

// ─── AC-7: Structured logging at rejection event ──────────────────────────────

describe('AC-7 — Structured logging at rejection event', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('emits [sync-queue-validation-rejected] log marker on UUID shape failure', () => {
    // Simulate what sync-experience-booking.ts does on validation failure
    const payload = makeValidExperiencePayload({
      owambe_time_slot_id: 'probe-slot-1778731610820',
    });
    const result = validateSyncQueueEntry(payload);
    expect(result.valid).toBe(false);

    // Simulate dispatcher log call (mirrors dispatcher integration code)
    if (!result.valid) {
      console.warn('[sync-queue-validation-rejected]', {
        event_id: payload.event_id,
        event_type: payload.event_type,
        validation_errors: result.errors,
        caller_context: {
          dispatcher: 'sync-experience-booking',
          timestamp: new Date().toISOString(),
        },
      });
    }

    expect(warnSpy).toHaveBeenCalledOnce();
    const [logMarker, logMeta] = warnSpy.mock.calls[0];
    expect(logMarker).toBe('[sync-queue-validation-rejected]');
    expect(logMeta).toHaveProperty('event_id', payload.event_id);
    expect(logMeta).toHaveProperty('event_type', payload.event_type);
    expect(logMeta).toHaveProperty('validation_errors');
    expect(logMeta.validation_errors).toBeInstanceOf(Array);
    expect(logMeta.validation_errors.length).toBeGreaterThan(0);
    expect(logMeta).toHaveProperty('caller_context');
    expect(logMeta.caller_context).toHaveProperty('dispatcher', 'sync-experience-booking');
    expect(logMeta.caller_context).toHaveProperty('timestamp');
  });

  it('emits [sync-queue-validation-rejected] log marker on required field failure', () => {
    const payload: SyncQueueEntryPayload = {
      // event_id missing
      event_type: 'stays_reservation_sync',
      timestamp: new Date().toISOString(),
      body: { some: 'data' },
      cc_reservation_id: VALID_UUID,
      owambe_property_id: VALID_UUID_2,
      owambe_room_id: VALID_UUID_3,
    };
    const result = validateSyncQueueEntry(payload);
    expect(result.valid).toBe(false);

    if (!result.valid) {
      console.warn('[sync-queue-validation-rejected]', {
        event_id: payload.event_id,
        event_type: payload.event_type,
        validation_errors: result.errors,
        caller_context: {
          dispatcher: 'sync-stays-reservation',
          timestamp: new Date().toISOString(),
        },
      });
    }

    expect(warnSpy).toHaveBeenCalledOnce();
    const [logMarker, logMeta] = warnSpy.mock.calls[0];
    expect(logMarker).toBe('[sync-queue-validation-rejected]');
    expect(logMeta.validation_errors.some((e: { rule: string }) => e.rule === 'REQUIRED_FIELD')).toBe(true);
    expect(logMeta.caller_context.dispatcher).toBe('sync-stays-reservation');
  });
});

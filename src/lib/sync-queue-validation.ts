/**
 * CC-PHASE-5-3-A: Sync Queue Entry Validation Gate
 *
 * Rejects diagnostic-generated synthetic values from reaching production sync paths.
 *
 * Rationale: Phase 5.1 arc surfaced diagnostic-tooling-drift — CC seed endpoints
 * producing synthetic non-UUID values (e.g., `probe-slot-${Date.now()}`) that entered
 * the production sync queue and propagated to the Owambe handler, precipitating
 * Prisma P2023 rejection and a six-layer inference chain.
 *
 * Validation rules:
 *   rule-1 (UUID_SHAPE):       ID fields must be valid UUID v4
 *   rule-2 (REQUIRED_FIELD):   Required envelope fields must be present
 *   rule-3 (DIAGNOSTIC_ORIGIN): ID fields must not carry diagnostic-tooling prefixes
 *
 * Integration: called at entry layer of both outbound dispatchers before dispatch logic.
 * Return type is synchronous (no async/Promise) — in-memory shape verification only.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ValidationError {
  rule: 'UUID_SHAPE' | 'REQUIRED_FIELD' | 'DIAGNOSTIC_ORIGIN';
  field: string;
  message: string;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

/**
 * Minimal envelope shape expected at sync queue entry.
 * Concrete dispatchers pass their full payload; this interface captures the
 * fields the validation gate inspects.
 */
export interface SyncQueueEntryPayload {
  // Required envelope fields (rule-2)
  event_id?: string;
  event_type?: string;
  timestamp?: string | number | Date;
  body?: unknown;

  // UUID ID fields (rule-1 + rule-3) — present in experience booking payloads
  cc_booking_id?: string;
  experience_id?: string;
  owambe_time_slot_id?: string;

  // UUID ID fields — present in stays reservation payloads
  cc_reservation_id?: string;
  owambe_property_id?: string;
  owambe_room_id?: string;
  guest_owambe_user_id?: string | null;

  // Allow additional fields from concrete dispatcher payloads
  [key: string]: unknown;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * UUID v4 regex per RFC 4122.
 * Matches: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx (case-insensitive)
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Diagnostic-tooling prefix conventions observed in CC codebase seed endpoints.
 * Sources:
 *   - `probe-slot-${currency}-${Date.now()}` — /api/diagnostic/seed/route.ts:151
 *   - `probe-exp-${currency}-${Date.now()}` — /api/diagnostic/seed/route.ts:110
 *   - `probe-operator-owambe-id` — /api/diagnostic/seed/route.ts:76
 *   - `founder-test-exp-001` — /api/diagnostic/seed-experience/route.ts:19
 *   - `founder-test-slot-001` — /api/diagnostic/seed-experience/route.ts:20
 *   - `founder-test-property-001` — /api/diagnostic/seed-property/route.ts:19
 *   - `founder-test-room-001` — /api/diagnostic/seed-property/route.ts:20
 *   - `seed-booking-ref-${Date.now()}` — /api/diagnostic/seed-booking/route.ts:97
 */
const DIAGNOSTIC_PREFIXES: readonly string[] = [
  'probe-',
  'founder-test-',
  'seed-',
  'synthetic-',
  'diagnostic-',
  'test-',
];

/**
 * ID fields that must pass UUID shape verification (rule-1) and
 * diagnostic-origin marker detection (rule-3).
 * null/undefined values are skipped (not all dispatchers populate all fields).
 */
const UUID_ID_FIELDS: readonly string[] = [
  'cc_booking_id',
  'experience_id',
  'owambe_time_slot_id',
  'cc_reservation_id',
  'owambe_property_id',
  'owambe_room_id',
  'guest_owambe_user_id',
];

/**
 * Required envelope fields (rule-2).
 * Per existing outbound dispatch contract shape.
 */
const REQUIRED_FIELDS: readonly string[] = [
  'event_id',
  'event_type',
  'timestamp',
  'body',
];

// ── Validation helpers ────────────────────────────────────────────────────────

function validateUUIDShape(
  value: string,
  field: string
): ValidationError | null {
  if (!UUID_V4_REGEX.test(value)) {
    return {
      rule: 'UUID_SHAPE',
      field,
      message: `Value '${value}' is not valid UUID v4`,
    };
  }
  return null;
}

function validateRequiredFields(
  payload: SyncQueueEntryPayload
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of REQUIRED_FIELDS) {
    const value = payload[field];
    if (value === undefined || value === null || value === '') {
      errors.push({
        rule: 'REQUIRED_FIELD',
        field,
        message: `Required field '${field}' is missing or empty`,
      });
    }
  }
  return errors;
}

function detectDiagnosticOriginMarkers(
  payload: SyncQueueEntryPayload
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of UUID_ID_FIELDS) {
    const value = payload[field];
    if (typeof value !== 'string' || value === '') continue;
    const lowerValue = value.toLowerCase();
    for (const prefix of DIAGNOSTIC_PREFIXES) {
      if (lowerValue.startsWith(prefix)) {
        errors.push({
          rule: 'DIAGNOSTIC_ORIGIN',
          field,
          message: `Value '${value}' matches diagnostic-origin prefix '${prefix}'`,
        });
        break; // one error per field is sufficient
      }
    }
  }
  return errors;
}

// ── Main validation gate ──────────────────────────────────────────────────────

/**
 * Validates a sync queue entry payload before production-bound dispatch.
 *
 * Applies three rules in order:
 *   1. Required field presence (rule-2)
 *   2. UUID shape on ID fields (rule-1)
 *   3. Diagnostic-origin marker detection on ID fields (rule-3)
 *
 * Returns `{ valid: true }` if all rules pass.
 * Returns `{ valid: false, errors }` with all accumulated errors if any rule fails.
 * Never throws — callers receive an error envelope, not an uncaught exception.
 */
export function validateSyncQueueEntry(
  payload: SyncQueueEntryPayload
): ValidationResult {
  const errors: ValidationError[] = [];

  // rule-2: required field presence
  errors.push(...validateRequiredFields(payload));

  // rule-1: UUID shape on ID fields
  for (const field of UUID_ID_FIELDS) {
    const value = payload[field];
    if (typeof value !== 'string' || value === '') continue; // null/undefined → skip
    const err = validateUUIDShape(value, field);
    if (err) errors.push(err);
  }

  // rule-3: diagnostic-origin marker detection
  errors.push(...detectDiagnosticOriginMarkers(payload));

  if (errors.length === 0) {
    return { valid: true };
  }
  return { valid: false, errors };
}
